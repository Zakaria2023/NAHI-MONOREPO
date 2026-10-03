import { z } from "zod";
import { employmentTypes, nationalities } from "../../../db/enum";
import { email, newPassword } from "./auth";
import { dateField, money, requiredText } from "./common";

export const periodField = z.string().regex(/^\d{4}-\d{2}$/, "Pick a month");

/** A Saudi IBAN: SA, two check digits, then 20 digits. */
export const iban = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, "").toUpperCase())
  .pipe(z.string().regex(/^SA\d{22}$/, "A Saudi IBAN is SA followed by 22 digits"));

const wholeDays = z.coerce.number<string | number>().int("Whole days").min(0, "Cannot be negative").max(30, "At most 30");

export const employeeSchema = z
  .object({
    name: requiredText("Name"),
    jobTitle: requiredText("Job title"),
    nationality: z.enum(nationalities),
    employmentType: z.enum(employmentTypes),
    basicSalary: money,
    housingAllowance: money,
    transportAllowance: money,
    dailyRate: money,
    iban,
    bankName: requiredText("Bank"),
    defaultProjectUuid: z.string(),
    joinedAt: dateField,
    /** Optional: given, the employee gets a sign-in with the Employee role. */
    loginEmail: z.string().trim().toLowerCase(),
    loginPassword: z.string(),
  })
  .refine((v) => (v.employmentType === "daily" ? v.dailyRate > 0 : v.basicSalary > 0), {
    message: "A monthly employee needs a basic salary, a daily worker a daily rate",
    path: ["basicSalary"],
  })
  .refine((v) => !v.loginEmail || email.safeParse(v.loginEmail).success, { message: "Enter a valid e-mail", path: ["loginEmail"] })
  .refine((v) => !v.loginEmail || newPassword.safeParse(v.loginPassword).success, {
    message: "A sign-in needs a password of at least 8 characters",
    path: ["loginPassword"],
  });

export type EmployeeInput = z.infer<typeof employeeSchema>;

export const timesheetSchema = z.object({
  employeeUuid: z.string().min(1, "Pick an employee"),
  period: periodField,
  absentDays: wholeDays,
  overtimeHours: money,
  /** An empty `projectUuid` is head office. */
  allocations: z.array(z.object({ projectUuid: z.string(), days: wholeDays })).min(1, "Add at least one line"),
});

export type TimesheetInput = z.infer<typeof timesheetSchema>;

export const attendanceSchema = z.object({
  employeeUuid: z.string().min(1, "Pick a worker"),
  date: dateField,
  projectUuid: z.string().min(1, "Pick the site"),
  hours: z.coerce.number<string | number>().positive("Must be more than 0").max(16, "At most 16 hours"),
});

export type AttendanceInput = z.infer<typeof attendanceSchema>;

export const payrollRunSchema = z.object({
  period: periodField,
});

export type PayrollRunInput = z.infer<typeof payrollRunSchema>;

export const payrollPaymentSchema = z.object({
  bankReference: requiredText("Bank reference"),
});

export type PayrollPaymentInput = z.infer<typeof payrollPaymentSchema>;
