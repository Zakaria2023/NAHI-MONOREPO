import { nowIso } from "utils";
import { readStore } from "../../../../db";
import {
  balanceSheetReport,
  dataChanges,
  exceptionsReport,
  generalLedger,
  incomeStatementReport,
  lateApprovals,
  manualEntries,
  trialBalanceReport,
  zakatReport,
} from "./books-reports";
import {
  assetCountReport,
  budgetOverruns,
  cashFlowActual,
  cashFlowExpected,
  cashFlowVsBudget,
  costCentreReport,
  costToDate,
  customerStatement,
  gosiReport,
  labourCostReport,
  openCommitments,
  paymentNotices,
  pendingCustomerInvoices,
  pendingSupplierInvoices,
  projectProfitability,
  subcontractBalances,
  subcontractorMaterials,
} from "./finance-reports";
import {
  itemPriceHistory,
  openLatePurchaseOrders,
  overdueCustody,
  purchasesByDepartment,
  receiptsAndIssues,
  stocktakeDifferences,
  supplierPerformance,
  supplierPriceComparison,
} from "./procurement-reports";
import { ReportData, ReportEntry, ReportGroup, ReportParams } from "./report";
import { taskPerformance, taskRegister } from "./task-reports";

// EVERY REPORT THE FOUR DOCUMENTS ASK FOR, in one catalogue. A report either is
// built here, or is an existing screen (`href`) — the stock balance, the ageing,
// the payroll register — so the reports centre lists all of them in one place.

export type ReportSummary = Omit<ReportEntry, "build"> & { built: boolean };

export type ReportView = ReportSummary & ReportData;

export const REPORT_GROUPS: ReportGroup[] = [
  "Projects",
  "Procurement & warehouse",
  "Payables & subcontractors",
  "Customers",
  "Budgets & cost",
  "Payroll & assets",
  "Treasury & tax",
  "Financial statements",
  "Tasks",
  "Control",
];

const MOBILY = "Mobily workflow §7";
const STC = "STC workflow §6";
const PROC = "Procurement & warehouse §6";

export const REPORTS: ReportEntry[] = [
  // Projects
  { slug: "project-tracking", title: "Tracking board per PO", group: "Projects", source: MOBILY, description: "Each project's current stage and the documents still missing.", href: "/projects" },
  { slug: "pending-approvals", title: "Approvals still open", group: "Projects", source: STC, description: "Every document and step waiting for someone, by role.", href: "/approvals" },
  { slug: "alerts", title: "Alerts", group: "Projects", source: `${MOBILY}, ${STC}`, description: "Permits, FAC, final clearance, the 24-hour wait, C09, deliveries and invoices.", href: "/alerts" },

  // Procurement & warehouse
  { slug: "stock-balance", title: "Stock balance and item card", group: "Procurement & warehouse", source: PROC, description: "What every warehouse holds, at average cost; each item's movements.", href: "/warehouse/stock" },
  { slug: "below-reorder", title: "Items below reorder level", group: "Procurement & warehouse", source: PROC, description: "Items whose total stock is under their reorder level.", href: "/warehouse/stock?filter=below" },
  { slug: "employee-custody", title: "Employee custody statement", group: "Procurement & warehouse", source: PROC, description: "What each employee holds — assets and cash.", href: "/custody/employees" },
  { slug: "receipts-issues", title: "Receipts and issues", group: "Procurement & warehouse", source: PROC, description: "Every stock movement of a month, in and out, with its value.", build: receiptsAndIssues },
  { slug: "stocktake-differences", title: "Stocktake differences", group: "Procurement & warehouse", source: PROC, description: "Book against counted, line by line, and the value of each difference.", build: stocktakeDifferences },
  { slug: "overdue-custody", title: "Custody overdue or not returned", group: "Procurement & warehouse", source: PROC, description: "Assets past their count and cash custody past its settlement date.", build: overdueCustody },
  { slug: "open-late-pos", title: "Open and late purchase orders", group: "Procurement & warehouse", source: PROC, description: "POs not fully received, how much has come, and how late.", build: openLatePurchaseOrders },
  { slug: "supplier-prices", title: "Supplier price comparison", group: "Procurement & warehouse", source: PROC, description: "Each item's price from each supplier — quoted, ordered and under contract.", build: supplierPriceComparison },
  { slug: "item-price-history", title: "Item price history", group: "Procurement & warehouse", source: PROC, description: "Every price an item was quoted, ordered or contracted at, over time.", build: itemPriceHistory },
  { slug: "supplier-performance", title: "Supplier performance", group: "Procurement & warehouse", source: PROC, description: "Evaluations, deliveries on time, returns and penalties per supplier.", build: supplierPerformance },
  { slug: "purchases-by-department", title: "Approved purchases by department", group: "Procurement & warehouse", source: PROC, description: "Approved requests and what was ordered, per department.", build: purchasesByDepartment },

  // Payables & subcontractors
  { slug: "supplier-ageing", title: "Supplier ageing and weekly due schedule", group: "Payables & subcontractors", source: "Finance §1", description: "What is owed to whom, by age, and what falls due each week.", href: "/finance/schedule" },
  { slug: "supplier-statement", title: "Supplier statement", group: "Payables & subcontractors", source: "Finance §1", description: "Open it from any supplier invoice — with the match against the supplier's own statement.", href: "/finance/payables" },
  { slug: "pending-supplier-invoices", title: "Pending supplier invoices", group: "Payables & subcontractors", source: "Finance §1", description: "Invoices not yet approved or not yet fully paid.", build: pendingSupplierInvoices },
  { slug: "payment-notices", title: "Payment notices sent", group: "Payables & subcontractors", source: "Finance §1", description: "Every payment and the notice e-mailed to the supplier.", build: paymentNotices },
  { slug: "subcontractor-statement", title: "Subcontractor statement", group: "Payables & subcontractors", source: "Finance §2", description: "Extracts, deductions and payments per subcontractor.", href: "/finance/subcontracts" },
  { slug: "subcontract-balances", title: "Subcontract order balances", group: "Payables & subcontractors", source: "Finance §2", description: "Each order's value, certified, still to do, advance and retention held.", build: subcontractBalances },
  { slug: "subcontractor-materials", title: "Materials issued to subcontractors", group: "Payables & subcontractors", source: "Finance §2", description: "Stock issued to subcontractors and what came off their extracts.", build: subcontractorMaterials },

  // Customers
  { slug: "customer-ageing", title: "Customer ageing and retentions", group: "Customers", source: "Finance §3", description: "What Mobily and STC owe, by age.", href: "/finance/receivables" },
  { slug: "extract-form", title: "Extract in the required form", group: "Customers", source: "Finance §3", description: "Each extract's lines and deductions, printable.", href: "/finance/extracts" },
  { slug: "pending-customer-invoices", title: "Extracts and invoices with the customer", group: "Customers", source: "Finance §3, §9", description: "Invoices submitted and not yet collected, and how overdue.", build: pendingCustomerInvoices },
  { slug: "customer-statement", title: "Customer statement", group: "Customers", source: "Finance §3", description: "Invoices against collections, with the running balance.", build: customerStatement },

  // Budgets & cost
  { slug: "budget-vs-actual", title: "Budget against actual", group: "Budgets & cost", source: "Finance §4", description: "Each project's planned, reserved, committed and spent, by category.", href: "/finance/budgets" },
  { slug: "open-commitments", title: "Open commitments", group: "Budgets & cost", source: "Finance §4, §9", description: "Ordered or contracted, not yet invoiced or certified.", build: openCommitments },
  { slug: "project-profitability", title: "Profitability per project", group: "Budgets & cost", source: "Finance §4, §9", description: "Revenue invoiced against cost to date, with the margin.", build: projectProfitability },
  { slug: "cost-to-date", title: "Cost to date per project", group: "Budgets & cost", source: "Finance §4, §9", description: "Actual cost per project, by budget category.", build: costToDate },
  { slug: "budget-overruns", title: "Budget overruns", group: "Budgets & cost", source: "Finance §4", description: "Approved budget lines that are exceeded.", build: budgetOverruns },
  { slug: "cost-centres", title: "Cost-centre report", group: "Budgets & cost", source: "Finance §4, §9", description: "Expenses, labour, depreciation and overhead per cost centre.", build: costCentreReport },

  // Payroll & assets
  { slug: "payroll-register", title: "Payroll register, payslips and bank file", group: "Payroll & assets", source: "Finance §6", description: "Each month's run, every payslip and the salary transfer file.", href: "/payroll/runs" },
  { slug: "labour-cost", title: "Labour cost per project", group: "Payroll & assets", source: "Finance §6", description: "What each project's labour cost, month by month.", build: labourCostReport },
  { slug: "gosi", title: "Social insurance", group: "Payroll & assets", source: "Finance §8, §9", description: "Employee and company GOSI by month, and whether it is paid.", build: gosiReport },
  { slug: "asset-register", title: "Fixed-asset register and depreciation", group: "Payroll & assets", source: "Finance §7", description: "Every asset's card and book value; each month's depreciation.", href: "/finance/assets" },
  { slug: "asset-count", title: "Annual asset count", group: "Payroll & assets", source: "Finance §7", description: "Which assets were counted this year, found or missing.", build: assetCountReport },

  // Treasury & tax
  { slug: "bank-balances", title: "Bank balances", group: "Treasury & tax", source: "Finance §9", description: "Each account's balance, movements and reconciliation.", href: "/finance/bank" },
  { slug: "cheques", title: "Post-dated and bounced cheques", group: "Treasury & tax", source: "Finance §9", description: "Cheques not yet through the bank, and those that bounced.", href: "/finance/cheques" },
  { slug: "guarantees", title: "Retentions and letters of guarantee", group: "Treasury & tax", source: "Finance §9", description: "Guarantees in force and expiring; retentions held.", href: "/finance/guarantees" },
  { slug: "cash-flow-actual", title: "Actual cash flow", group: "Treasury & tax", source: "Finance §9", description: "Cash in and out of every account, month by month.", build: cashFlowActual },
  { slug: "cash-flow-expected", title: "Expected cash flow", group: "Treasury & tax", source: "Finance §9", description: "The next three months: what customers owe, what is owed, payroll and open POs.", build: cashFlowExpected },
  { slug: "cash-flow-vs-budget", title: "Cash flow against budget", group: "Treasury & tax", source: "Finance §9", description: "Per project: the budget, what is spent and what is collected.", build: cashFlowVsBudget },
  { slug: "vat-return", title: "VAT return", group: "Treasury & tax", source: "Finance §8, §9", description: "Output and input VAT by month and by quarter.", href: "/finance/vat?view=quarterly" },
  { slug: "tax-calendar", title: "Tax and insurance calendar", group: "Treasury & tax", source: "Finance §8", description: "VAT returns and GOSI payments, due dates and filings.", href: "/finance/obligations" },
  { slug: "zakat", title: "Zakat estimate", group: "Treasury & tax", source: "Finance §9", description: "The zakat base and an estimate of the year's zakat.", build: zakatReport },

  // Financial statements
  { slug: "trial-balance", title: "Trial balance", group: "Financial statements", source: "Finance §9", description: "Every account's debits, credits and balance.", build: trialBalanceReport },
  { slug: "general-ledger", title: "General ledger", group: "Financial statements", source: "Finance §9", description: "One account's entries with the running balance.", build: generalLedger },
  { slug: "income-statement", title: "Income statement", group: "Financial statements", source: "Finance §9 (final accounts)", description: "Revenue, cost of projects, operating expenses and profit for a year.", build: incomeStatementReport },
  { slug: "balance-sheet", title: "Balance sheet", group: "Financial statements", source: "Finance §9 (final accounts)", description: "Assets, liabilities and equity today.", build: balanceSheetReport },

  // Tasks
  { slug: "task-performance", title: "Task performance by employee", group: "Tasks", source: "Task management", description: "Open, unseen, overdue and done tasks per employee, on-time rate and average working days.", build: taskPerformance },
  { slug: "task-register", title: "Task register", group: "Tasks", source: "Task management", description: "Every task: when it was given, seen, started and finished, the days worked and the hours logged.", build: taskRegister },
  { slug: "team-workload", title: "Team workload", group: "Tasks", source: "Task management", description: "Who is carrying what right now.", href: "/tasks/team" },

  // Control
  { slug: "audit-log", title: "Audit log", group: "Control", source: "Finance §9, procurement §7", description: "Every change, who made it and when.", href: "/activity" },
  { slug: "exceptions", title: "Exceptions and overrides", group: "Control", source: "Finance §9", description: "Rejections, bounces, differences and write-offs.", build: exceptionsReport },
  { slug: "manual-entries", title: "Manual entries", group: "Control", source: "Finance §9", description: "Every manual expense entry with its cost centres.", build: manualEntries },
  { slug: "data-changes", title: "Data changes", group: "Control", source: "Finance §9", description: "Modified POs, revised budgets, updated timesheets, recalculations.", build: dataChanges },
  { slug: "late-approvals", title: "Late approvals", group: "Control", source: "Finance §9", description: "What has waited more than three days for its approver.", build: lateApprovals },
];

const summary = ({ build, ...entry }: ReportEntry): ReportSummary => ({ ...entry, built: Boolean(build) });

export const listReports = async (): Promise<ReportSummary[]> => REPORTS.map(summary);

export const getReport = async (slug: string, params: ReportParams = {}): Promise<ReportView | null> => {
  const entry = REPORTS.find((r) => r.slug === slug);
  if (!entry?.build) {
    return null;
  }
  return { ...summary(entry), ...entry.build(readStore(), params, nowIso()) };
};
