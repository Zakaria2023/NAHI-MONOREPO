import { generateUuid } from "utils";
import { demoPasswordHash } from "../packages/services/src/core/password";
import { Store } from "./types";

// SIGN-INS FOR PEOPLE ON THE PAYROLL. Staff who are also employees point at
// their payroll record; three site workers get a plain Employee sign-in, so the
// demo can be seen as an employee as well as a manager. All use the demo password.

const EMPLOYEE_LOGINS = [
  { name: "Bandar Al-Qahtani", email: "bandar@example.sa" },
  { name: "Mohammed Rafiq", email: "mohammed@example.sa" },
  { name: "Tariq Hussain", email: "tariq@example.sa" },
];

export const addEmployeeLogins = (store: Store): void => {
  for (const user of store.StaffUsers) {
    user.employeeUuid = store.Employees.find((e) => e.name === user.name)?.uuid;
  }
  for (const login of EMPLOYEE_LOGINS) {
    const employee = store.Employees.find((e) => e.name === login.name);
    if (!employee) {
      throw new Error(`Login seed is missing ${login.name}`);
    }
    store.StaffUsers.push({
      uuid: generateUuid(),
      name: employee.name,
      email: login.email,
      role: "employee",
      region: "central",
      passwordHash: demoPasswordHash(),
      employeeUuid: employee.uuid,
    });
  }
};
