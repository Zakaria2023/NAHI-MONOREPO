import { generateUuid } from "utils";
import { Store } from "./types";

// ACCOUNTS FOR PEOPLE ON THE PAYROLL. Staff who are also employees point at
// their payroll record; three site workers get a plain Employee account, so the
// demo can switch between the admin and an employee from the navbar.

const EMPLOYEE_ACCOUNTS = [
  { name: "Bandar Al-Qahtani", email: "bandar@example.sa" },
  { name: "Mohammed Rafiq", email: "mohammed@example.sa" },
  { name: "Tariq Hussain", email: "tariq@example.sa" },
];

export const addEmployeeAccounts = (store: Store): void => {
  for (const user of store.StaffUsers) {
    user.employeeUuid = store.Employees.find((e) => e.name === user.name)?.uuid;
  }
  for (const account of EMPLOYEE_ACCOUNTS) {
    const employee = store.Employees.find((e) => e.name === account.name);
    if (!employee) {
      throw new Error(`Account seed is missing ${account.name}`);
    }
    store.StaffUsers.push({
      uuid: generateUuid(),
      name: employee.name,
      email: account.email,
      role: "employee",
      region: "central",
      employeeUuid: employee.uuid,
    });
  }
};
