import { formatMoney, generateUuid, nowIso, round2, sumBy, toIso } from "utils";
import {
  AttendanceInput,
  DecisionFormInput,
  EmployeeInput,
  PayrollPaymentInput,
  PayrollRunInput,
  TimesheetInput,
} from "validators";
import { readStore, transact } from "../../../db";
import { AttendanceEntry, Employee, PayrollRun, Payslip, Project, Store, Timesheet } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { ChainState, chainState, decide } from "./core/approvals";
import { assertNotFuture, assertRole, findOrThrow } from "./core/lookup";
import { FINANCE_EDITORS, REQUESTERS } from "./core/roles";
import { PAYROLL_CHAIN } from "./rules/chains";
import { computePayslip, timesheetBlocker, timesheetFromAttendance } from "./rules/payroll";

// PAYROLL (finance §6) and social insurance (§8).
//
//   timesheets (monthly staff) / attendance app (daily workers)
//     → payroll run: every active employee's payslip, fixed when calculated
//     → approved by the finance manager → paid, with the bank transfer file
//
// A run's labour cost is split over projects by the days on each timesheet and
// counts against each project's manpower budget once the run is approved.

export type EmployeeRow = Employee & {
  defaultProjectCode?: Project["code"];
  /** What a full month costs the company, employer GOSI included. */
  monthlyCost: number;
};

export type TimesheetRow = {
  employee: Pick<Employee, "uuid" | "code" | "name" | "jobTitle" | "employmentType">;
  timesheet: Timesheet | null;
  /** For a daily worker: the month as the attendance app recorded it. */
  attendanceDays: number;
};

export type AttendanceRow = AttendanceEntry & {
  employeeName: Employee["name"];
  projectCode: Project["code"];
};

export type PayrollTotals = {
  employees: number;
  gross: number;
  deductions: number;
  net: number;
  gosiEmployee: number;
  gosiEmployer: number;
  cost: number;
};

export type PayrollRunRow = Omit<PayrollRun, "payslips"> & {
  totals: PayrollTotals;
  awaiting: ChainState["nextRole"];
};

export type LaborCostRow = {
  projectUuid?: string;
  projectCode: string;
  projectName: string;
  days: number;
  amount: number;
};

export type PayrollRunDetail = {
  run: PayrollRun;
  totals: PayrollTotals;
  chain: ChainState;
  laborCost: LaborCostRow[];
};

export type PayslipView = {
  run: Pick<PayrollRun, "uuid" | "number" | "period" | "status" | "paidAt">;
  payslip: Payslip;
  allocations: (Payslip["costAllocations"][number] & { projectCode: string })[];
};

const PAYROLL_EDITORS = FINANCE_EDITORS;

/** Who may record timesheets and attendance: the site managers and payroll. */
const TIME_KEEPERS = [...new Set([...REQUESTERS, ...FINANCE_EDITORS])];

const log = (store: Store, actor: Actor, entity: "employee" | "timesheet" | "payroll_run", uuid: string, label: string, action: string, detail?: string) =>
  logActivity(store, { actorName: actor.name, entity, entityUuid: uuid, entityLabel: label, action, detail });

const totalsOf = (payslips: Payslip[]): PayrollTotals => ({
  employees: payslips.length,
  gross: round2(sumBy(payslips, (p) => p.gross)),
  deductions: round2(sumBy(payslips, (p) => p.absenceDeduction + p.gosiEmployee)),
  net: round2(sumBy(payslips, (p) => p.net)),
  gosiEmployee: round2(sumBy(payslips, (p) => p.gosiEmployee)),
  gosiEmployer: round2(sumBy(payslips, (p) => p.gosiEmployer)),
  cost: round2(sumBy(payslips.flatMap((p) => p.costAllocations), (a) => a.amount)),
});

const inPeriod = (iso: string, period: string): boolean => iso.slice(0, 7) === period;

const projectLabel = (store: Store, projectUuid?: string) => {
  const project = projectUuid ? store.Projects.find((p) => p.uuid === projectUuid) : undefined;
  return project ? { projectCode: project.code, projectName: project.name } : { projectCode: "Head office", projectName: "Overhead" };
};

/** The labour cost a set of runs charges each project. Shared with budgets and reports. */
export const laborCostByProject = (store: Store, runs: PayrollRun[]): LaborCostRow[] => {
  const byProject = new Map<string, { days: number; amount: number; projectUuid?: string }>();
  for (const a of runs.flatMap((r) => r.payslips.flatMap((p) => p.costAllocations))) {
    const key = a.projectUuid ?? "";
    const row = byProject.get(key) ?? { days: 0, amount: 0, projectUuid: a.projectUuid };
    byProject.set(key, { ...row, days: row.days + a.days, amount: round2(row.amount + a.amount) });
  }
  return [...byProject.values()]
    .map((row) => ({ ...row, ...projectLabel(store, row.projectUuid) }))
    .sort((a, b) => b.amount - a.amount);
};

/** Approved and paid runs: the labour cost booked so far. */
export const bookedPayrollRuns = (store: Store): PayrollRun[] =>
  store.PayrollRuns.filter((r) => r.status === "approved" || r.status === "paid");

const sheetFor = (store: Store, employee: Employee, period: string) => {
  const sheet = store.Timesheets.find((t) => t.employeeUuid === employee.uuid && t.period === period);
  if (sheet || employee.employmentType === "monthly") {
    return sheet;
  }
  return timesheetFromAttendance(
    store.AttendanceEntries.filter((e) => e.employeeUuid === employee.uuid && inPeriod(e.date, period)),
  );
};

const assertPeriodOpen = (store: Store, period: string): void => {
  const run = store.PayrollRuns.find((r) => r.period === period);
  if (run && run.status !== "draft") {
    throw new Error(`Payroll for ${period} is already ${run.status} — its timesheets are closed`);
  }
};

// ─── Employees ─────────────────────────────────────────────────────────────

export const listEmployees = async (): Promise<EmployeeRow[]> => {
  const store = readStore();
  return store.Employees.map((e) => ({
    ...e,
    defaultProjectCode: e.defaultProjectUuid ? store.Projects.find((p) => p.uuid === e.defaultProjectUuid)?.code : undefined,
    monthlyCost:
      e.employmentType === "daily"
        ? round2((e.dailyRate ?? 0) * 26)
        : sumBy(computePayslip(e, undefined).costAllocations, (a) => a.amount),
  }));
};

export const createEmployee = async (actor: Actor, input: EmployeeInput): Promise<Employee> => {
  assertRole(actor.role, PAYROLL_EDITORS, "add employees");
  return transact((store) => {
    if (store.Employees.some((e) => e.iban === input.iban)) {
      throw new Error("Another employee is already paid to this IBAN");
    }
    if (input.defaultProjectUuid) {
      findOrThrow(store.Projects, input.defaultProjectUuid, "Project");
    }
    const daily = input.employmentType === "daily";
    const employee: Employee = {
      uuid: generateUuid(),
      code: `EMP-${String(store.Employees.length + 1).padStart(3, "0")}`,
      name: input.name,
      jobTitle: input.jobTitle,
      nationality: input.nationality,
      employmentType: input.employmentType,
      basicSalary: daily ? 0 : round2(input.basicSalary),
      housingAllowance: daily ? 0 : round2(input.housingAllowance),
      transportAllowance: daily ? 0 : round2(input.transportAllowance),
      dailyRate: daily ? round2(input.dailyRate) : undefined,
      iban: input.iban,
      bankName: input.bankName,
      defaultProjectUuid: input.defaultProjectUuid || undefined,
      joinedAt: toIso(input.joinedAt),
      active: true,
    };
    store.Employees.push(employee);
    log(store, actor, "employee", employee.uuid, employee.code, "Employee added", `${employee.name} — ${employee.jobTitle}`);
    return employee;
  });
};

// ─── Timesheets and attendance ─────────────────────────────────────────────

export const listTimesheets = async (period: string): Promise<TimesheetRow[]> => {
  const store = readStore();
  return store.Employees.filter((e) => e.active).map((e) => ({
    employee: { uuid: e.uuid, code: e.code, name: e.name, jobTitle: e.jobTitle, employmentType: e.employmentType },
    timesheet: store.Timesheets.find((t) => t.employeeUuid === e.uuid && t.period === period) ?? null,
    attendanceDays: store.AttendanceEntries.filter((a) => a.employeeUuid === e.uuid && inPeriod(a.date, period)).length,
  }));
};

/** Records or replaces an employee's timesheet for a month whose payroll is still open. */
export const saveTimesheet = async (actor: Actor, input: TimesheetInput): Promise<void> => {
  assertRole(actor.role, TIME_KEEPERS, "record timesheets");
  transact((store) => {
    const employee = findOrThrow(store.Employees, input.employeeUuid, "Employee");
    assertPeriodOpen(store, input.period);
    const allocations = input.allocations
      .filter((a) => a.days > 0)
      .map((a) => ({ projectUuid: a.projectUuid || undefined, days: a.days }));
    for (const a of allocations) {
      if (a.projectUuid) {
        findOrThrow(store.Projects, a.projectUuid, "Project");
      }
    }
    const blocker = timesheetBlocker({ allocations, absentDays: input.absentDays, overtimeHours: input.overtimeHours });
    if (blocker) {
      throw new Error(blocker);
    }
    const existing = store.Timesheets.find((t) => t.employeeUuid === employee.uuid && t.period === input.period);
    const sheet: Timesheet = {
      uuid: existing?.uuid ?? generateUuid(),
      employeeUuid: employee.uuid,
      period: input.period,
      allocations,
      absentDays: input.absentDays,
      overtimeHours: round2(input.overtimeHours),
      submittedBy: actor.name,
      submittedAt: nowIso(),
    };
    store.Timesheets = [...store.Timesheets.filter((t) => t.uuid !== sheet.uuid), sheet];
    log(store, actor, "timesheet", sheet.uuid, `${employee.code} ${input.period}`, existing ? "Timesheet updated" : "Timesheet recorded", employee.name);
  });
};

export const listAttendance = async (period: string): Promise<AttendanceRow[]> => {
  const store = readStore();
  return store.AttendanceEntries.filter((a) => inPeriod(a.date, period))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((a) => ({
      ...a,
      employeeName: findOrThrow(store.Employees, a.employeeUuid, "Employee").name,
      projectCode: findOrThrow(store.Projects, a.projectUuid, "Project").code,
    }));
};

/** A daily worker's day — what the attendance app sends; entered here when the app is not used. */
export const recordAttendance = async (actor: Actor, input: AttendanceInput): Promise<void> => {
  assertRole(actor.role, TIME_KEEPERS, "record attendance");
  const date = toIso(input.date);
  assertNotFuture(date);
  transact((store) => {
    const employee = findOrThrow(store.Employees, input.employeeUuid, "Employee");
    if (employee.employmentType !== "daily") {
      throw new Error("Attendance is recorded for daily workers; monthly staff use timesheets");
    }
    findOrThrow(store.Projects, input.projectUuid, "Project");
    assertPeriodOpen(store, date.slice(0, 7));
    if (store.AttendanceEntries.some((a) => a.employeeUuid === employee.uuid && a.date === date)) {
      throw new Error("This worker's attendance for the day is already recorded");
    }
    store.AttendanceEntries.push({
      uuid: generateUuid(),
      employeeUuid: employee.uuid,
      date,
      projectUuid: input.projectUuid,
      hours: input.hours,
      source: "admin",
      recordedBy: actor.name,
    });
    log(store, actor, "employee", employee.uuid, employee.code, "Attendance recorded", `${date.slice(0, 10)} — ${input.hours} h`);
  });
};

// ─── Payroll runs ──────────────────────────────────────────────────────────

const toRunRow = (run: PayrollRun): PayrollRunRow => {
  const { payslips, ...rest } = run;
  return {
    ...rest,
    totals: totalsOf(payslips),
    awaiting: run.status === "draft" ? chainState(PAYROLL_CHAIN, run.approvals).nextRole : null,
  };
};

export const listPayrollRuns = async (): Promise<PayrollRunRow[]> =>
  [...readStore().PayrollRuns].sort((a, b) => b.period.localeCompare(a.period)).map(toRunRow);

export const getPayrollRun = async (uuid: string): Promise<PayrollRunDetail> => {
  const store = readStore();
  const run = findOrThrow(store.PayrollRuns, uuid, "Payroll run");
  return {
    run,
    totals: totalsOf(run.payslips),
    chain: chainState(PAYROLL_CHAIN, run.approvals),
    laborCost: laborCostByProject(store, [run]),
  };
};

export const getPayslip = async (runUuid: string, employeeUuid: string): Promise<PayslipView> => {
  const store = readStore();
  const run = findOrThrow(store.PayrollRuns, runUuid, "Payroll run");
  const payslip = run.payslips.find((p) => p.employeeUuid === employeeUuid);
  if (!payslip) {
    throw new Error("This employee is not on the run");
  }
  return {
    run: { uuid: run.uuid, number: run.number, period: run.period, status: run.status, paidAt: run.paidAt },
    payslip,
    allocations: payslip.costAllocations.map((a) => ({ ...a, projectCode: projectLabel(store, a.projectUuid).projectCode })),
  };
};

const payslipsFor = (store: Store, period: string): Payslip[] =>
  store.Employees.filter((e) => e.active && e.joinedAt.slice(0, 7) <= period)
    .map((e) => computePayslip(e, sheetFor(store, e, period)))
    .filter((p) => p.gross > 0);

/** Calculates the month: one payslip per active employee, from timesheets and attendance. */
export const createPayrollRun = async (actor: Actor, input: PayrollRunInput): Promise<PayrollRun> => {
  assertRole(actor.role, PAYROLL_EDITORS, "run payroll");
  return transact((store) => {
    if (store.PayrollRuns.some((r) => r.period === input.period)) {
      throw new Error(`Payroll for ${input.period} has already been run`);
    }
    if (input.period > nowIso().slice(0, 7)) {
      throw new Error("Payroll is run for the current month or an earlier one");
    }
    const payslips = payslipsFor(store, input.period);
    if (payslips.length === 0) {
      throw new Error("No one is due pay for this month");
    }
    const run: PayrollRun = {
      uuid: generateUuid(),
      number: `PAY-${input.period}`,
      period: input.period,
      status: "draft",
      payslips,
      approvals: [],
      createdBy: actor.name,
      createdAt: nowIso(),
    };
    store.PayrollRuns.push(run);
    log(store, actor, "payroll_run", run.uuid, run.number, "Payroll calculated", `${payslips.length} employees — net ${formatMoney(totalsOf(payslips).net)}`);
    return run;
  });
};

/** A draft is recalculated after timesheets change. */
export const recalculatePayrollRun = async (actor: Actor, uuid: string): Promise<void> => {
  assertRole(actor.role, PAYROLL_EDITORS, "recalculate payroll");
  transact((store) => {
    const run = findOrThrow(store.PayrollRuns, uuid, "Payroll run");
    if (run.status !== "draft") {
      throw new Error("Only a draft run is recalculated");
    }
    run.payslips = payslipsFor(store, run.period);
    run.approvals = [];
    log(store, actor, "payroll_run", run.uuid, run.number, "Payroll recalculated", `Net ${formatMoney(totalsOf(run.payslips).net)}`);
  });
};

export const decidePayrollRun = async (actor: Actor, uuid: string, input: DecisionFormInput): Promise<void> =>
  transact((store) => {
    const run = findOrThrow(store.PayrollRuns, uuid, "Payroll run");
    if (run.status !== "draft") {
      throw new Error("This run is not waiting for approval");
    }
    const approvals = decide(PAYROLL_CHAIN, run.approvals, { actor, ...input });
    const state = chainState(PAYROLL_CHAIN, approvals);
    // A rejection sends the draft back to payroll to correct and recalculate.
    run.approvals = state.rejected ? [] : approvals;
    if (state.complete) {
      run.status = "approved";
    }
    log(store, actor, "payroll_run", run.uuid, run.number, input.decision === "approved" ? "Approved" : "Returned for correction", input.note);
  });

/** Paid by bank transfer: the file goes to the bank, the run closes. */
export const payPayrollRun = async (actor: Actor, uuid: string, input: PayrollPaymentInput): Promise<void> => {
  assertRole(actor.role, PAYROLL_EDITORS, "pay salaries");
  transact((store) => {
    const run = findOrThrow(store.PayrollRuns, uuid, "Payroll run");
    if (run.status !== "approved") {
      throw new Error("Salaries are paid once the run is approved");
    }
    run.status = "paid";
    run.paidAt = nowIso();
    run.paidBy = actor.name;
    run.bankReference = input.bankReference;
    log(store, actor, "payroll_run", run.uuid, run.number, "Salaries paid by bank transfer", `${input.bankReference} — ${formatMoney(totalsOf(run.payslips).net)}`);
  });
};
