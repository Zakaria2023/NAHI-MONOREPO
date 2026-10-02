import { Store } from "../../../../db/types";

// THE REPORT SHAPE. Every report in the catalogue (finance §9, procurement §6
// and the reports each section asks for) returns plain columns and rows, so one
// screen shows any of them, exports it to Excel and prints it.

export type ReportColumnKind = "text" | "money" | "number" | "date" | "percent";

export type ReportCell = string | number | null;

export type ReportColumn = {
  key: string;
  header: string;
  kind: ReportColumnKind;
  /** Free text that may wrap. */
  wrap?: boolean;
};

export type ReportRow = {
  key: string;
  cells: Record<string, ReportCell>;
  /** Where the row's first cell links. */
  href?: string;
  /** A subtotal or total line. */
  emphasis?: boolean;
};

export type ReportFigure = {
  label: string;
  value: ReportCell;
  kind: ReportColumnKind;
  hint?: string;
};

/** A choice the report offers — which account, which customer, which year. */
export type ReportChoice = {
  param: "account" | "party" | "year" | "period" | "item";
  label: string;
  options: { value: string; label: string }[];
  selected: string;
};

export type ReportData = {
  columns: ReportColumn[];
  rows: ReportRow[];
  figures?: ReportFigure[];
  choices?: ReportChoice[];
  note?: string;
};

export type ReportParams = Partial<Record<ReportChoice["param"], string>>;

export type ReportGroup =
  | "Projects"
  | "Procurement & warehouse"
  | "Payables & subcontractors"
  | "Customers"
  | "Budgets & cost"
  | "Payroll & assets"
  | "Treasury & tax"
  | "Financial statements"
  | "Control";

export type ReportEntry = {
  slug: string;
  title: string;
  group: ReportGroup;
  /** Where the documents ask for it. */
  source: string;
  description: string;
  /** A report built here; absent when an existing screen already is the report. */
  build?: (store: Store, params: ReportParams, now: string) => ReportData;
  /** The screen that is the report, when it has one of its own. */
  href?: string;
};

/** Shorthand for a column. */
export const col = (key: string, header: string, kind: ReportColumnKind = "text", wrap = false): ReportColumn => ({ key, header, kind, wrap });
