import { StaffRole } from "../../../../db/enum";

// WHO SEES WHICH PAGES. The admin runs the company: every module, all tasks and
// the team's workload — but has no "My tasks", since nobody gives the admin work.
// A plain employee sees only their own dashboard and their tasks. Every other
// role is staff: the whole system, and their own tasks too.

/** The pages a plain employee may open. */
const EMPLOYEE_PAGES = [/^\/$/, /^\/tasks\/my$/, /^\/tasks\/new$/, /^\/tasks\/[0-9a-f-]{36}$/];

/** Pages that belong to someone who is given work — not the admin. */
const OWN_WORK_PAGES = ["/tasks/my"];

/** Where to send `role` instead of `pathname`, or null when they may open it. */
export const accessRedirect = (role: StaffRole, pathname: string): string | null => {
  if (role === "employee") {
    return EMPLOYEE_PAGES.some((page) => page.test(pathname)) ? null : "/";
  }
  if (role === "system_admin" && OWN_WORK_PAGES.includes(pathname)) {
    return "/tasks";
  }
  return null;
};

/** Whether the role has a "My tasks" of its own. */
export const hasOwnTasks = (role: StaffRole): boolean => role !== "system_admin";
