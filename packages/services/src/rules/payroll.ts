import { round2 } from "utils";
import { AttendanceEntry, Employee, Payslip, Timesheet } from "../../../../db/types";

// THE PAYROLL RULES (finance §6, and the social insurance of §8).
//
// Assumptions, recorded in docs/finance.md:
//   - A month is 30 days, as Saudi payroll counts it.
//   - Absence is deducted at (basic + housing + transport) ÷ 30 a day.
//   - Overtime is paid at 1.5 × the hourly rate (basic ÷ 30 ÷ 8, or the daily rate ÷ 8).
//   - GOSI on basic + housing, capped at SAR 45,000: a Saudi pays 9.75 % and the
//     company 11.75 %; for a non-Saudi only the company pays, 2 % (occupational hazards).

export type TimesheetFigures = Pick<Timesheet, "allocations" | "absentDays" | "overtimeHours">;

export const DAYS_IN_MONTH = 30;
export const OVERTIME_MULTIPLIER = 1.5;
export const GOSI_BASE_CAP = 45000;

export const GOSI_RATES = {
  saudi: { employee: 0.0975, employer: 0.1175 },
  non_saudi: { employee: 0, employer: 0.02 },
} as const;

/** Social insurance on a month's basic + housing. */
export const gosiFor = (
  nationality: Employee["nationality"],
  basic: number,
  housing: number,
): { employee: number; employer: number } => {
  const base = Math.min(basic + housing, GOSI_BASE_CAP);
  const rates = GOSI_RATES[nationality];
  return { employee: round2(base * rates.employee), employer: round2(base * rates.employer) };
};

/** A daily worker's month, built from what the attendance app recorded. Hours past 8 a day are overtime. */
export const timesheetFromAttendance = (entries: AttendanceEntry[]): TimesheetFigures => {
  const days = new Map<string, number>();
  for (const entry of entries) {
    days.set(entry.projectUuid, (days.get(entry.projectUuid) ?? 0) + 1);
  }
  return {
    allocations: [...days.entries()].map(([projectUuid, count]) => ({ projectUuid, days: count })),
    absentDays: 0,
    overtimeHours: round2(entries.reduce((sum, e) => sum + Math.max(0, e.hours - 8), 0)),
  };
};

/** Splits `amount` over the allocations by days; the rounding remainder goes to the last one. */
const allocate = (
  amount: number,
  allocations: { projectUuid?: string; days: number }[],
): Payslip["costAllocations"] => {
  const total = allocations.reduce((sum, a) => sum + a.days, 0);
  let left = amount;
  return allocations.map((a, index) => {
    const share = index === allocations.length - 1 ? round2(left) : round2((amount * a.days) / total);
    left = round2(left - share);
    return { projectUuid: a.projectUuid, days: a.days, amount: share };
  });
};

/**
 * One employee's pay for a month. Without a timesheet a monthly employee is paid
 * the full month and costed to their default project; a daily worker is paid
 * the days on the timesheet (built from attendance) and nothing else.
 */
export const computePayslip = (employee: Employee, sheet: TimesheetFigures | undefined): Payslip => {
  const daily = employee.employmentType === "daily";
  const absentDays = daily ? 0 : Math.min(DAYS_IN_MONTH, sheet?.absentDays ?? 0);
  const allocated = (sheet?.allocations ?? []).filter((a) => a.days > 0);
  const workedDays = daily
    ? allocated.reduce((sum, a) => sum + a.days, 0)
    : DAYS_IN_MONTH - absentDays;
  const overtimeHours = sheet?.overtimeHours ?? 0;

  const rate = employee.dailyRate ?? 0;
  const basic = daily ? round2(rate * workedDays) : employee.basicSalary;
  const housing = daily ? 0 : employee.housingAllowance;
  const transport = daily ? 0 : employee.transportAllowance;
  const hourly = daily ? rate / 8 : employee.basicSalary / DAYS_IN_MONTH / 8;
  const overtime = round2(hourly * OVERTIME_MULTIPLIER * overtimeHours);
  const gross = round2(basic + housing + transport + overtime);
  const absenceDeduction = round2(((basic + housing + transport) / DAYS_IN_MONTH) * absentDays);
  const gosi = gosiFor(employee.nationality, basic, housing);
  const net = round2(gross - absenceDeduction - gosi.employee);
  const cost = round2(gross - absenceDeduction + gosi.employer);
  const allocations =
    allocated.length > 0 ? allocated : [{ projectUuid: employee.defaultProjectUuid, days: Math.max(workedDays, 1) }];

  return {
    employeeUuid: employee.uuid,
    employeeCode: employee.code,
    employeeName: employee.name,
    jobTitle: employee.jobTitle,
    nationality: employee.nationality,
    employmentType: employee.employmentType,
    iban: employee.iban,
    bankName: employee.bankName,
    workedDays,
    absentDays,
    overtimeHours,
    basic,
    housing,
    transport,
    overtime,
    gross,
    absenceDeduction,
    gosiEmployee: gosi.employee,
    net,
    gosiEmployer: gosi.employer,
    costAllocations: allocate(cost, allocations),
  };
};

/** Why a timesheet cannot be saved, or null: the days cannot exceed the month. */
export const timesheetBlocker = (sheet: TimesheetFigures): string | null => {
  const allocated = sheet.allocations.reduce((sum, a) => sum + a.days, 0);
  if (allocated + sheet.absentDays > DAYS_IN_MONTH) {
    return `Days worked and absent add up to more than ${DAYS_IN_MONTH}`;
  }
  return null;
};
