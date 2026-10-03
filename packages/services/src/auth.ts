import { generateUuid } from "utils";
import { EmployeeLoginInput, SignInInput } from "validators";
import { readStore, transact } from "../../../db";
import { Employee, StaffUser, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertRole, findOrThrow } from "./core/lookup";
import { MIN_PASSWORD_LENGTH, hashPassword, verifyPassword } from "./core/password";
import { FINANCE_EDITORS } from "./core/roles";

// SIGNING IN — the MVP's stand-in for Clerk. Every staff member has an e-mail
// and a hashed password; HR can give any employee on the payroll a sign-in with
// the plain Employee role. The app keeps who signed in in a cookie.

/** A staff member as the app sees them: never with the password hash. */
export type StaffAccount = Omit<StaffUser, "passwordHash">;

/** Give employees a sign-in: the payroll editors and the system admin. */
const LOGIN_EDITORS = [...FINANCE_EDITORS];

export const toStaffAccount = (user: StaffUser): StaffAccount => ({
  uuid: user.uuid,
  name: user.name,
  email: user.email,
  role: user.role,
  region: user.region,
  employeeUuid: user.employeeUuid,
});

/** The staff member with this e-mail and password; one message for either being wrong, so neither is revealed. */
export const signIn = async (input: SignInInput): Promise<StaffAccount> => {
  const user = readStore().StaffUsers.find((u) => u.email.toLowerCase() === input.email.trim().toLowerCase());
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new Error("Wrong e-mail or password");
  }
  return toStaffAccount(user);
};

export const getStaffByEmail = async (email: string): Promise<StaffAccount | null> => {
  const user = readStore().StaffUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return user ? toStaffAccount(user) : null;
};

/**
 * Adds the sign-in inside the caller's `transact`, so an employee and their
 * sign-in are created together or not at all.
 */
export const addEmployeeLogin = (store: Store, actor: Actor, employee: Employee, email: string, password: string): StaffUser => {
  const address = email.trim().toLowerCase();
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`A password needs at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (store.StaffUsers.some((u) => u.email.toLowerCase() === address)) {
    throw new Error("Someone already signs in with this e-mail");
  }
  if (store.StaffUsers.some((u) => u.employeeUuid === employee.uuid)) {
    throw new Error(`${employee.name} already has a sign-in`);
  }
  const user: StaffUser = {
    uuid: generateUuid(),
    name: employee.name,
    email: address,
    role: "employee",
    region: "central",
    passwordHash: hashPassword(password),
    employeeUuid: employee.uuid,
  };
  store.StaffUsers.push(user);
  logActivity(store, {
    actorName: actor.name,
    entity: "employee",
    entityUuid: employee.uuid,
    entityLabel: employee.code,
    action: "Sign-in created",
    detail: `${employee.name} signs in as ${address}`,
  });
  return user;
};

export const createEmployeeLogin = async (actor: Actor, input: EmployeeLoginInput): Promise<StaffAccount> => {
  assertRole(actor.role, LOGIN_EDITORS, "give employees a sign-in");
  return transact((store) => {
    const employee = findOrThrow(store.Employees, input.employeeUuid, "Employee");
    return toStaffAccount(addEmployeeLogin(store, actor, employee, input.email, input.password));
  });
};
