import { beforeEach, describe, expect, it } from "vitest";
import { readStore, resetStore } from "../../../db";
import { StaffRole } from "../../../db/enum";
import { Actor } from "./core/actor";
import { createEmployee, listEmployees } from "./payroll";

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

describe("accounts", () => {
  it("seeds one admin and three employees to switch between", () => {
    const users = readStore().StaffUsers;
    expect(users.filter((u) => u.role === "system_admin")).toHaveLength(1);
    expect(users.filter((u) => u.role === "employee").map((u) => u.name)).toEqual(["Bandar Al-Qahtani", "Mohammed Rafiq", "Tariq Hussain"]);
  });

  it("gives every new employee an Employee account under their e-mail", async () => {
    await createEmployee(as("accountant"), { ...newEmployee, accountEmail: "khalid.test@example.sa" });
    const employee = (await listEmployees()).find((e) => e.name === "Khalid Test");
    const user = readStore().StaffUsers.find((u) => u.email === "khalid.test@example.sa");
    expect(user).toMatchObject({ role: "employee", employeeUuid: employee?.uuid });
  });

  it("refuses an e-mail another account uses — and then adds no employee either", async () => {
    const before = readStore().Employees.length;
    await expect(createEmployee(as("accountant"), { ...newEmployee, accountEmail: "omar@example.sa" })).rejects.toThrow(/already uses/);
    expect(readStore().Employees).toHaveLength(before);
  });
});
