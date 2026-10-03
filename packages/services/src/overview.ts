import { calendarDaysBetween, nowIso, round2, sumBy } from "utils";
import { readStore } from "../../../db";
import { PAYROLL_RUN_STATUS_LABELS } from "../../../db/label";
import { listBankAccounts, listCheques, listGuarantees } from "./banking";
import { listFixedAssets } from "./assets";
import { listClosingPeriods } from "./closing";
import { listSupplierContracts } from "./contracts";
import { CUSTODY_SETTLEMENT_DAYS, listCashCustodies } from "./custody";
import { getDashboardSummary } from "./dashboard";
import { listObligations } from "./obligations";
import { listSupplierInvoices } from "./payables";
import { listEmployees, listPayrollRuns } from "./payroll";
import { listPurchaseOrders, listPurchaseRequests } from "./procurement";
import { listCustomerInvoices } from "./receivables";
import { listTasks } from "./tasks";
import { listAssetCustodies, listStock, listWarehouseDocuments } from "./warehouse";

// THE COMPANY AT A GLANCE: every area of the system — tasks, people and payroll,
// projects, procurement, warehouse, custody, payables, receivables, treasury and
// the books — boiled down to the few figures someone running it checks each day.
// Each figure links to the screen it is counted from.

export type OverviewFigureKind = "count" | "money" | "hours";

export type OverviewTone = "neutral" | "success" | "warning" | "danger";

export type OverviewFigure = {
  label: string;
  value: number;
  kind: OverviewFigureKind;
  /** Red or amber when the figure is a problem and not zero. */
  tone: OverviewTone;
  href: string;
};

export type OverviewSection = {
  key: string;
  title: string;
  /** One line on the state of the area. */
  summary: string;
  href: string;
  figures: OverviewFigure[];
};

/** How far ahead a contract or guarantee ending counts as "ending soon". */
const ENDING_SOON_DAYS = 30;

/** Days back that count as "recent" — done, collected, spent. */
const RECENT_DAYS = 30;

const figure = (label: string, value: number, href: string, kind: OverviewFigureKind = "count", alarm?: "warning" | "danger"): OverviewFigure => ({
  label,
  value: round2(value),
  kind,
  tone: alarm && value > 0 ? alarm : "neutral",
  href,
});

export const getCompanyOverview = async (): Promise<OverviewSection[]> => {
  const now = nowIso();
  const recent = (iso: string | undefined) => Boolean(iso) && calendarDaysBetween(iso ?? now, now) < RECENT_DAYS;
  const [
    tasks,
    employees,
    runs,
    summary,
    requests,
    orders,
    contracts,
    stock,
    docs,
    assetCustody,
    cash,
    supplierInvoices,
    customerInvoices,
    accounts,
    cheques,
    guarantees,
    assets,
    obligations,
    closing,
  ] = await Promise.all([
    listTasks(),
    listEmployees(),
    listPayrollRuns(),
    getDashboardSummary("system_admin"),
    listPurchaseRequests(),
    listPurchaseOrders(),
    listSupplierContracts(),
    listStock(),
    listWarehouseDocuments(),
    listAssetCustodies(),
    listCashCustodies(),
    listSupplierInvoices(),
    listCustomerInvoices(),
    listBankAccounts(),
    listCheques(),
    listGuarantees(),
    listFixedAssets(),
    listObligations(),
    listClosingPeriods(),
  ]);
  const store = readStore();

  const openTasks = tasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
  const active = employees.filter((e) => e.active);
  const lastRun = [...runs].sort((a, b) => b.period.localeCompare(a.period))[0];
  const nextGosi = obligations.find((o) => o.kind === "gosi" && o.status !== "filed");
  const nextVat = obligations.find((o) => o.kind === "vat" && o.status !== "filed");
  const openRequests = requests.filter((r) => !["ordered", "fulfilled_from_stock", "rejected"].includes(r.status));
  const openOrders = orders.filter((o) => ["pending_approval", "approved", "sent", "partially_received"].includes(o.status));
  const disbursed = cash.filter((c) => c.status === "disbursed");
  const unpaidSupplier = supplierInvoices.filter((i) => i.outstanding > 0 && i.status !== "rejected");
  const unpaidCustomer = customerInvoices.filter((i) => !i.paidAt);
  const current = closing.find((p) => p.period === now.slice(0, 7));
  const activeAssets = assets.filter((a) => a.status === "active");
  const awaitingExtracts = store.Extracts.filter((e) => ["submitted", "engineer_approved", "pm_approved"].includes(e.status));

  return [
    {
      key: "tasks",
      title: "Tasks",
      summary: `${openTasks.length} open across ${new Set(openTasks.map((t) => t.assigneeUuid)).size} people`,
      href: "/tasks",
      figures: [
        figure("Not seen yet", openTasks.filter((t) => !t.seenAt).length, "/tasks?view=unseen", "count", "warning"),
        figure("In progress", openTasks.filter((t) => t.status === "in_progress").length, "/tasks?view=in_progress"),
        figure("Overdue", tasks.filter((t) => t.overdue).length, "/tasks?view=overdue", "count", "danger"),
        figure("Waiting for review", tasks.filter((t) => t.status === "in_review").length, "/tasks?view=in_review"),
        figure(`Done, last ${RECENT_DAYS} days`, tasks.filter((t) => t.status === "done" && recent(t.completedAt)).length, "/tasks?view=done"),
        figure("Hours logged", sumBy(tasks, (t) => t.clock.loggedHours), "/tasks/team", "hours"),
      ],
    },
    {
      key: "people",
      title: "Employees & payroll",
      summary: lastRun ? `Payroll ${lastRun.period}: ${PAYROLL_RUN_STATUS_LABELS[lastRun.status].toLowerCase()}` : "No payroll run yet",
      href: "/payroll/employees",
      figures: [
        figure("Active employees", active.length, "/payroll/employees"),
        figure("Daily workers", active.filter((e) => e.employmentType === "daily").length, "/payroll/timesheets"),
        figure("Monthly staff cost", sumBy(active.filter((e) => e.employmentType === "monthly"), (e) => e.monthlyCost), "/payroll/employees", "money"),
        figure("Last payroll, net", lastRun?.totals.net ?? 0, lastRun ? `/payroll/runs/${lastRun.uuid}` : "/payroll/runs", "money"),
        figure("Runs awaiting approval", runs.filter((r) => r.status === "draft").length, "/payroll/runs", "count", "warning"),
        figure("Next GOSI payment", nextGosi?.amount ?? 0, "/finance/obligations", "money", nextGosi?.status === "overdue" ? "danger" : undefined),
      ],
    },
    {
      key: "projects",
      title: "Projects",
      summary: summary.projects.map((p) => `${p.operator === "mobily" ? "Mobily" : "STC"} ${p.active} active`).join(" · "),
      href: "/projects",
      figures: [
        figure("Active", sumBy(summary.projects, (p) => p.active), "/projects"),
        figure("Closed", sumBy(summary.projects, (p) => p.closed), "/projects"),
        figure("Budget lines over", summary.budgetOverruns.length, "/reports/budget-overruns", "count", "danger"),
        figure("Approvals waiting", summary.pendingTotal, "/approvals", "count", "warning"),
      ],
    },
    {
      key: "procurement",
      title: "Procurement",
      summary: `${openOrders.length} purchase orders open`,
      href: "/procurement/orders",
      figures: [
        figure("Open requests", openRequests.length, "/procurement/requests"),
        figure("Open POs", openOrders.length, "/procurement/orders"),
        figure("Late deliveries", openOrders.filter((o) => o.late).length, "/reports/open-late-pos", "count", "danger"),
        figure("Value on order", sumBy(openOrders, (o) => o.total), "/procurement/orders", "money"),
        figure(
          "Contracts ending soon",
          contracts.filter((c) => c.active && calendarDaysBetween(now, c.endsAt) <= ENDING_SOON_DAYS).length,
          "/procurement/contracts",
          "count",
          "warning",
        ),
      ],
    },
    {
      key: "warehouse",
      title: "Warehouse",
      summary: `${stock.filter((s) => s.total > 0).length} items in stock`,
      href: "/warehouse/stock",
      figures: [
        figure("Stock value", sumBy(stock, (s) => s.value), "/warehouse/stock", "money"),
        figure("Below reorder level", stock.filter((s) => s.belowReorder).length, "/warehouse/stock?filter=below", "count", "warning"),
        figure("Documents awaiting approval", docs.filter((d) => d.awaiting).length, "/warehouse/documents", "count", "warning"),
        figure("Assets with employees", assetCustody.filter((c) => c.status === "with_employee").length, "/warehouse/custody"),
        figure("Custody counts overdue", assetCustody.filter((c) => c.countOverdue).length, "/warehouse/custody", "count", "danger"),
      ],
    },
    {
      key: "custody",
      title: "Cash custody",
      summary: `${disbursed.length} custody with employees`,
      href: "/custody",
      figures: [
        figure("Cash with employees", sumBy(disbursed, (c) => c.amount), "/custody?status=disbursed", "money"),
        figure("Awaiting approval", cash.filter((c) => c.status === "pending_approval").length, "/custody?status=pending_approval", "count", "warning"),
        figure("Settlement overdue", disbursed.filter((c) => (c.openDays ?? 0) > CUSTODY_SETTLEMENT_DAYS).length, "/custody?status=disbursed", "count", "danger"),
      ],
    },
    {
      key: "payables",
      title: "Payables & subcontractors",
      summary: `${unpaidSupplier.length} supplier invoices not fully paid`,
      href: "/finance/payables",
      figures: [
        figure("Owed to suppliers", sumBy(unpaidSupplier, (i) => i.outstanding), "/finance/schedule", "money"),
        figure("Overdue", unpaidSupplier.filter((i) => i.overdue).length, "/finance/schedule", "count", "danger"),
        figure("Invoices to approve", supplierInvoices.filter((i) => i.status === "registered").length, "/finance/payables", "count", "warning"),
        figure("Extracts in approval", awaitingExtracts.length, "/finance/extracts", "count", "warning"),
      ],
    },
    {
      key: "receivables",
      title: "Receivables",
      summary: `${unpaidCustomer.length} customer invoices open`,
      href: "/finance/receivables",
      figures: [
        figure("Owed by customers", sumBy(unpaidCustomer, (i) => i.total), "/finance/receivables", "money"),
        figure("Overdue", unpaidCustomer.filter((i) => i.overdue).length, "/finance/receivables", "count", "danger"),
        figure(`Collected, last ${RECENT_DAYS} days`, sumBy(customerInvoices.filter((i) => recent(i.paidAt)), (i) => i.total), "/finance/receivables", "money"),
      ],
    },
    {
      key: "treasury",
      title: "Treasury",
      summary: `${accounts.length} bank accounts`,
      href: "/finance/bank",
      figures: [
        figure("Cash in banks", sumBy(accounts, (a) => a.balance), "/finance/bank", "money"),
        figure("Cheques pending", cheques.filter((c) => c.status === "pending").length, "/finance/cheques"),
        figure("Bounced cheques", cheques.filter((c) => c.status === "bounced").length, "/finance/cheques", "count", "danger"),
        figure("Guarantees expiring", guarantees.filter((g) => g.status === "expiring" || g.status === "expired").length, "/finance/guarantees", "count", "warning"),
      ],
    },
    {
      key: "books",
      title: "Assets, tax & closing",
      summary: current ? `${current.items.filter((i) => i.done).length} of ${current.items.length} closing items done this month` : "Closing not started",
      href: "/finance/closing",
      figures: [
        figure("Fixed assets, book value", sumBy(activeAssets, (a) => a.bookValue), "/finance/assets", "money"),
        figure("Not counted this year", activeAssets.filter((a) => !a.countedThisYear).length, "/reports/asset-count", "count", "warning"),
        figure("Next VAT return", nextVat?.amount ?? 0, "/finance/obligations", "money", nextVat?.status === "overdue" ? "danger" : undefined),
        figure(`Expenses, last ${RECENT_DAYS} days`, sumBy(store.Expenses.filter((e) => recent(e.date)), (e) => e.amount), "/finance/expenses", "money"),
      ],
    },
  ];
};
