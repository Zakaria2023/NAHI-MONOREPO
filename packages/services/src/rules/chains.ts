import { StaffRole } from "../../../../db/enum";

// Every approval chain named in docs/, in the order the documents give.

/** PR step 2. */
export const PR_CHAIN: StaffRole[] = ["direct_manager"];

/** PR step 3, when procurement finds the stock is available. */
export const STOCK_SUPPLY_CHAIN: StaffRole[] = [
  "region_project_manager",
  "projects_manager",
  "procurement",
];

/** Quotation approval (step 6) and PO approval (step 8) — the same six. */
export const PURCHASE_CHAIN: StaffRole[] = [
  "region_project_manager",
  "procurement",
  "projects_manager",
  "finance_manager",
  "operations_manager",
  "deputy_gm",
];

export const ISSUE_CHAIN: StaffRole[] = ["region_project_manager"];

export const TRANSFER_CHAIN: StaffRole[] = [
  "warehouse_keeper",
  "region_accountant",
  "region_project_manager",
  "projects_manager",
  "operations_manager",
];

/** "Differences settled with management approval" — see docs assumptions. */
export const STOCKTAKE_CHAIN: StaffRole[] = ["operations_manager"];

export const WRITE_OFF_CHAIN: StaffRole[] = [
  "warehouse_keeper",
  "region_project_manager",
  "projects_manager",
  "finance_manager",
  "operations_manager",
  "deputy_gm",
];

export const CASH_CUSTODY_CHAIN: StaffRole[] = [
  "region_accountant",
  "region_project_manager",
  "projects_manager",
  "finance_manager",
  "operations_manager",
  "deputy_gm",
];

/** Subcontractor extract: engineer, then projects manager, then finance. */
export const EXTRACT_CHAIN: StaffRole[] = [
  "project_engineer",
  "projects_manager",
  "finance_manager",
];
