import { z } from "zod";

/** Kept in step with the services' MIN_PASSWORD_LENGTH. */
const MIN_PASSWORD = 8;

export const email = z.string().trim().toLowerCase().email("Enter a valid e-mail");

export const newPassword = z.string().min(MIN_PASSWORD, `At least ${MIN_PASSWORD} characters`).max(100);

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export type SignInInput = z.infer<typeof signInSchema>;

/** A sign-in for an employee already on the payroll. */
export const employeeLoginSchema = z.object({
  employeeUuid: z.string().min(1, "Pick an employee"),
  email,
  password: newPassword,
});

export type EmployeeLoginInput = z.infer<typeof employeeLoginSchema>;
