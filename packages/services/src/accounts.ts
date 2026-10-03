import { generateUuid } from "utils";
import { readStore } from "../../../db";
import { Employee, StaffUser, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";

// ACCOUNTS — who the app can act as. There is no sign-in in the MVP: the navbar
// switches between accounts. Every employee added to the payroll gets an
// account with the plain Employee role, and joins the switcher's list.

export const getStaffByEmail = async (email: string): Promise<StaffUser | null> =>
  readStore().StaffUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;

/**
 * Adds the account inside `createEmployee`'s `transact`, so an employee and
 * their account are created together or not at all.
 */
export const addEmployeeAccount = (store: Store, actor: Actor, employee: Employee, email: string): StaffUser => {
  const address = email.trim().toLowerCase();
  if (store.StaffUsers.some((u) => u.email.toLowerCase() === address)) {
    throw new Error("Another account already uses this e-mail");
  }
  if (store.StaffUsers.some((u) => u.employeeUuid === employee.uuid)) {
    throw new Error(`${employee.name} already has an account`);
  }
  const user: StaffUser = {
    uuid: generateUuid(),
    name: employee.name,
    email: address,
    role: "employee",
    region: "central",
    employeeUuid: employee.uuid,
  };
  store.StaffUsers.push(user);
  logActivity(store, {
    actorName: actor.name,
    entity: "employee",
    entityUuid: employee.uuid,
    entityLabel: employee.code,
    action: "Account created",
    detail: `${employee.name} — ${address}`,
  });
  return user;
};
