import { StaffRole } from "../../../../db/enum";

// Who may do what outside the approval chains. A chain names its own roles;
// these lists cover the plain edits — recording a step, registering a document.

/** Record project steps, permits, lab tests and STC documents. */
export const PROJECT_EDITORS: StaffRole[] = [
  "system_admin",
  "project_manager",
  "project_engineer",
  "region_project_manager",
  "projects_manager",
];

/** Create customer invoices and record collections. */
export const FINANCE_EDITORS: StaffRole[] = [
  "system_admin",
  "accountant",
  "finance_manager",
  "region_accountant",
];

export const PROCUREMENT_EDITORS: StaffRole[] = ["system_admin", "procurement"];

export const WAREHOUSE_EDITORS: StaffRole[] = ["system_admin", "warehouse_keeper"];

/** Raise purchase requests, issue requests and cash custody requests. */
export const REQUESTERS: StaffRole[] = [
  "system_admin",
  "project_manager",
  "project_engineer",
  "region_project_manager",
  "projects_manager",
];

/** Change an approved budget — the "limited rights" of finance section 4. */
export const BUDGET_EDITORS: StaffRole[] = ["projects_manager", "finance_manager"];

export const BUDGET_APPROVERS: StaffRole[] = ["projects_manager"];
