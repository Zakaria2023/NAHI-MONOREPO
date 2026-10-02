import { round2 } from "utils";
import { beforeEach, describe, expect, it } from "vitest";
import { readStore, resetStore } from "../../../db";
import { StaffRole } from "../../../db/enum";
import { Employee } from "../../../db/types";
import { budgetUsage } from "./budgets";
import { Actor } from "./core/actor";
import { listPendingApprovals } from "./dashboard";
import {
  createPayrollRun,
  decidePayrollRun,
  payPayrollRun,
  recordAttendance,
  saveTimesheet,
} from "./payroll";
import { computePayslip, gosiFor, timesheetFromAttendance } from "./rules/payroll";

const as = (role: StaffRole): Actor => {
  const user = readStore().StaffUsers.find((u) => u.role === role);
  if (!user) {
    throw new Error(`no ${role}`);
  }
  return { uuid: user.uuid, name: user.name, role };
};

const monthly: Employee = {
  uuid: "e1",
  code: "EMP-900",
  name: "Test",
  jobTitle: "Engineer",
  nationality: "saudi",
  employmentType: "monthly",
  basicSalary: 9000,
  housingAllowance: 2250,
  transportAllowance: 750,
  iban: "SA0000000000000000000000",
  bankName: "Bank",
  defaultProjectUuid: "p1",
  joinedAt: "2026-01-01T00:00:00.000Z",
  active: true,
};

const thisMonth = () => new Date().toISOString().slice(0, 7);

beforeEach(() => resetStore());

describe("payroll rules (finance §6, §8)", () => {
  it("charges GOSI by nationality on basic + housing, capped", () => {
    expect(gosiFor("saudi", 9000, 2250)).toEqual({ employee: 1096.88, employer: 1321.88 });
    expect(gosiFor("non_saudi", 4000, 1000)).toEqual({ employee: 0, employer: 100 });
    expect(gosiFor("saudi", 60000, 15000).employee).toBe(4387.5);
  });

  it("deducts absence a thirtieth a day and pays overtime at 1.5", () => {
    const slip = computePayslip(monthly, { allocations: [{ projectUuid: "p1", days: 28 }], absentDays: 2, overtimeHours: 10 });
    expect(slip.absenceDeduction).toBe(800);
    expect(slip.overtime).toBe(562.5);
    expect(slip.net).toBe(round2(12000 + 562.5 - 800 - 1096.88));
  });

  it("splits the employee's cost over projects by the days on the timesheet", () => {
    const slip = computePayslip(monthly, {
      allocations: [
        { projectUuid: "p1", days: 20 },
        { projectUuid: "p2", days: 10 },
      ],
      absentDays: 0,
      overtimeHours: 0,
    });
    const cost = 12000 + 1321.88;
    expect(slip.costAllocations.map((a) => a.amount)).toEqual([round2((cost * 2) / 3), round2(cost - round2((cost * 2) / 3))]);
  });

  it("pays a daily worker the days the attendance app recorded, with hours past 8 as overtime", () => {
    const sheet = timesheetFromAttendance([
      { uuid: "a", employeeUuid: "w", date: "2026-09-01T00:00:00.000Z", projectUuid: "p1", hours: 10, source: "attendance_app", recordedBy: "app" },
      { uuid: "b", employeeUuid: "w", date: "2026-09-02T00:00:00.000Z", projectUuid: "p2", hours: 8, source: "attendance_app", recordedBy: "app" },
    ]);
    expect(sheet).toMatchObject({ overtimeHours: 2, absentDays: 0 });
    const slip = computePayslip({ ...monthly, employmentType: "daily", nationality: "non_saudi", basicSalary: 0, housingAllowance: 0, transportAllowance: 0, dailyRate: 160 }, sheet);
    expect(slip).toMatchObject({ workedDays: 2, basic: 320, overtime: 60 });
  });
});

describe("payroll runs", () => {
  it("waits for the finance manager, then books the labour cost against the manpower budget", async () => {
    const draft = readStore().PayrollRuns.find((r) => r.status === "draft");
    if (!draft) {
      throw new Error("seed has no draft run");
    }
    expect((await listPendingApprovals("finance_manager")).some((p) => p.uuid === draft.uuid)).toBe(true);
    const mob1 = readStore().Projects.find((p) => p.code === "MOB-001")?.uuid ?? "";
    const before = budgetUsage(readStore(), mob1).find((l) => l.category === "manpower")?.spent ?? 0;
    await expect(payPayrollRun(as("accountant"), draft.uuid, { bankReference: "X" })).rejects.toThrow(/approved/);
    await decidePayrollRun(as("finance_manager"), draft.uuid, { decision: "approved" });
    const after = budgetUsage(readStore(), mob1).find((l) => l.category === "manpower")?.spent ?? 0;
    expect(after).toBeGreaterThan(before);
    await payPayrollRun(as("accountant"), draft.uuid, { bankReference: "WPS-1" });
    expect(readStore().PayrollRuns.find((r) => r.uuid === draft.uuid)?.status).toBe("paid");
  });

  it("closes a month's timesheets and attendance once its payroll is approved", async () => {
    const draft = readStore().PayrollRuns.find((r) => r.status === "draft");
    if (!draft) {
      throw new Error("seed has no draft run");
    }
    await decidePayrollRun(as("finance_manager"), draft.uuid, { decision: "approved" });
    const employee = readStore().Employees[0];
    await expect(
      saveTimesheet(as("project_manager"), {
        employeeUuid: employee.uuid,
        period: draft.period,
        absentDays: 0,
        overtimeHours: 0,
        allocations: [{ projectUuid: "", days: 30 }],
      }),
    ).rejects.toThrow(/closed/);
  });

  it("runs a month once, and records attendance only for daily workers", async () => {
    await expect(createPayrollRun(as("accountant"), { period: readStore().PayrollRuns[0].period })).rejects.toThrow(/already been run/);
    const monthlyEmployee = readStore().Employees.find((e) => e.employmentType === "monthly");
    const site = readStore().Projects[0].uuid;
    await expect(
      recordAttendance(as("project_manager"), {
        employeeUuid: monthlyEmployee?.uuid ?? "",
        date: `${thisMonth()}-01`,
        projectUuid: site,
        hours: 8,
      }),
    ).rejects.toThrow(/daily workers/);
  });
});
