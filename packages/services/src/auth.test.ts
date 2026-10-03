import { beforeEach, describe, expect, it } from "vitest";
import { readStore, resetStore } from "../../../db";
import { StaffRole } from "../../../db/enum";
import { createEmployeeLogin, signIn } from "./auth";
import { Actor } from "./core/actor";
import { DEMO_PASSWORD } from "./core/password";
import { createEmployee, listEmployees } from "./payroll";
import { listStaff } from "./staff";

const as = (role: StaffRole): Actor => {
  const user = readStore().StaffUsers.find((u) => u.role === role);
  if (!user) {
    throw new Error(`no ${role}`);
  }
  return { uuid: user.uuid, name: user.name, role };
};

const newEmployee = {
  name: "Khalid Test",
  jobTitle: "Technician",
  nationality: "saudi" as const,
  employmentType: "monthly" as const,
  basicSalary: 5000,
  housingAllowance: 0,
  transportAllowance: 0,
  dailyRate: 0,
  iban: "SA0380000000608010167519",
  bankName: "Al Rajhi",
  defaultProjectUuid: "",
  joinedAt: "2026-01-01",
};

beforeEach(() => resetStore());

describe("signing in", () => {
  it("lets a demo account in with the demo password, and nobody with a wrong one", async () => {
    const user = await signIn({ email: "nasser@example.sa", password: DEMO_PASSWORD });
    expect(user.role).toBe("system_admin");
    await expect(signIn({ email: "nasser@example.sa", password: "wrong-password" })).rejects.toThrow(/Wrong e-mail or password/);
    await expect(signIn({ email: "nobody@example.sa", password: DEMO_PASSWORD })).rejects.toThrow(/Wrong e-mail or password/);
  });

  it("never stores or hands out the password itself", async () => {
    expect(readStore().StaffUsers.every((u) => !u.passwordHash.includes(DEMO_PASSWORD))).toBe(true);
    expect((await listStaff()).some((u) => "passwordHash" in u)).toBe(false);
  });

  it("seeds employees who sign in with the Employee role", async () => {
    const user = await signIn({ email: "bandar@example.sa", password: DEMO_PASSWORD });
    expect(user).toMatchObject({ role: "employee", name: "Bandar Al-Qahtani" });
    expect(user.employeeUuid).toBeDefined();
  });
});

describe("an employee's sign-in", () => {
  it("is created with the employee when an e-mail and password are given", async () => {
    await createEmployee(as("accountant"), { ...newEmployee, loginEmail: "khalid.test@example.sa", loginPassword: "secret-123" });
    const user = await signIn({ email: "khalid.test@example.sa", password: "secret-123" });
    const employee = (await listEmployees()).find((e) => e.name === "Khalid Test");
    expect(user).toMatchObject({ role: "employee", employeeUuid: employee?.uuid });
  });

  it("refuses an e-mail someone already signs in with — and then adds no employee either", async () => {
    const before = readStore().Employees.length;
    await expect(createEmployee(as("accountant"), { ...newEmployee, loginEmail: "omar@example.sa", loginPassword: "secret-123" })).rejects.toThrow(/already signs in/);
    expect(readStore().Employees).toHaveLength(before);
  });

  it("can be given later, once, by payroll staff only", async () => {
    const employee = readStore().Employees.find((e) => e.name === "Arjun Nair");
    if (!employee) {
      throw new Error("no Arjun");
    }
    const input = { employeeUuid: employee.uuid, email: "arjun@example.sa", password: "secret-123" };
    await expect(createEmployeeLogin(as("project_engineer"), input)).rejects.toThrow(/role cannot/);
    await createEmployeeLogin(as("accountant"), input);
    await expect(createEmployeeLogin(as("accountant"), { ...input, email: "arjun2@example.sa" })).rejects.toThrow(/already has a sign-in/);
  });
});
