// THE PROJECT GUIDE's content: every page of the admin, what it does, the
// files that build it, the business functions it calls and the specification
// section it implements. Rendered at /guide; docs/project-guide.md is the same
// map for readers outside the app. Paths are relative to apps/admin/src unless
// they start with packages/ or db/.

export type GuideExample =
  | "mobily"
  | "stc"
  | "pr"
  | "po"
  | "item"
  | "issue"
  | "transfer"
  | "stocktake"
  | "writeOff"
  | "custody"
  | "invoice"
  | "supplier"
  | "subcontractor"
  | "extract";

export type GuidePage = {
  title: string;
  /** The route as written in app/. */
  route: string;
  /** A static route opens directly; a dynamic one opens a real example record. */
  href?: string;
  example?: GuideExample;
  /** Replaces the route's dynamic segment with the example's uuid. */
  examplePath?: (uuid: string) => string;
  does: string;
  page: string;
  components: string[];
  actions?: string;
  services: string;
  spec: string;
};

export type GuideSection = {
  id: string;
  title: string;
  summary: string;
  pages: GuidePage[];
};

export type GuideExampleLink = {
  uuid: string;
  /** The record's own number or code, shown on the link. */
  label: string;
};

export type GuideExamples = Partial<Record<GuideExample, GuideExampleLink>>;

export type GuideLink = {
  href: string;
  label: string;
};

export type GuideRule = {
  rule: string;
  where: string;
  test: string;
};

/** Where a guide row opens: its route, or — for a dynamic one — its example record. */
export const guideLink = (page: GuidePage, examples: GuideExamples): GuideLink | null => {
  if (page.href) {
    return { href: page.href, label: "Open page" };
  }
  const example = page.example ? examples[page.example] : undefined;
  return example && page.examplePath ? { href: page.examplePath(example.uuid), label: `Open ${example.label}` } : null;
};

export const GUIDE_LAYERS = [
  { layer: "Page", path: "app/(dashboard)/<route>/page.tsx", role: "Lays out the screen. No logic, no auth." },
  { layer: "Component", path: "components/<feature>/*.tsx", role: "Renders; reads data through a service; forms use a hook." },
  { layer: "Form hook", path: "app/(dashboard)/<route>/use-*.ts", role: "useActionForm: zod + react-hook-form + useActionState." },
  { layer: "Server Action", path: "app/(dashboard)/<route>/actions.ts", role: "runAction: who is acting, valid input, ONE service call." },
  { layer: "Service", path: "packages/services/src/<area>.ts", role: "The business operation, checked against its rules." },
  { layer: "Rule", path: "packages/services/src/rules/<area>.ts", role: "Pure functions; the reason text a locked button shows." },
  { layer: "Store", path: "db/index.ts → .data/store.json", role: "readStore() and transact() — the MVP's database." },
];

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    summary: "Where every day starts: what is waiting, what is falling due, where every project stands.",
    pages: [
      {
        title: "Dashboard",
        route: "/",
        href: "/",
        does: "Six KPIs (each opens its page), the steps waiting for you, the alerts, and every project's stage and missing items.",
        page: "app/(dashboard)/page.tsx",
        components: ["components/dashboard/kpi-row.tsx", "components/dashboard/approvals-panel.tsx", "components/dashboard/alerts-panel.tsx", "components/dashboard/project-pipeline.tsx"],
        services: "dashboard.ts (getDashboardSummary, listPendingApprovals), alerts.ts (listAlerts), projects.ts (listProjects)",
        spec: "Mobily §7 per-PO dashboard · STC §6",
      },
      {
        title: "My approvals",
        route: "/approvals",
        href: "/approvals",
        does: "Every step whose turn belongs to your role. The system admin sees every role's queue, each item saying who it waits for.",
        page: "app/(dashboard)/approvals/page.tsx",
        components: ["components/approvals/approvals-board.tsx", "components/shared/approval-list.tsx"],
        services: "dashboard.ts (listPendingApprovals)",
        spec: "Procurement §7 — notifications on pending requests",
      },
      {
        title: "Alerts",
        route: "/alerts",
        href: "/alerts",
        does: "Permits about to expire, FAC opening, Final Clearance due, the STC 24-hour wait, missing C09, late POs, items under reorder, overdue custody counts, unpaid invoices.",
        page: "app/(dashboard)/alerts/page.tsx",
        components: ["components/alerts/alerts-board.tsx", "components/shared/alert-list.tsx"],
        services: "alerts.ts (listAlerts and its collectors)",
        spec: "Mobily §7 · STC §6 · Procurement §1, §3 · Finance §3",
      },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    summary: "The Mobily and STC workflows — every stage, every step, and the rule that guards it.",
    pages: [
      {
        title: "Projects",
        route: "/projects",
        href: "/projects",
        does: "Every site: PO, current stage with progress, what is missing, PM. Tabs All / Mobily / STC and search.",
        page: "app/(dashboard)/projects/page.tsx",
        components: ["components/projects/projects-table.tsx"],
        services: "projects.ts (listProjects)",
        spec: "Mobily §7 · STC §6",
      },
      {
        title: "New project",
        route: "/projects/new",
        href: "/projects/new",
        does: "Creates a project; a Mobily one starts at the design request, an STC one at Design.",
        page: "app/(dashboard)/projects/new/page.tsx",
        components: ["components/projects/project-form.tsx"],
        actions: "projects/new/actions.ts · hook projects/new/use-project-form.ts",
        services: "projects.ts (createProject)",
        spec: "—",
      },
      {
        title: "Mobily project",
        route: "/projects/[uuid]",
        example: "mobily",
        examplePath: (uuid) => `/projects/${uuid}`,
        does: "The 13 stages: each step done, locked by its rule, or open to record. Permits with computed expiry, lab tests, certificates linked to their I-Supplier invoices and due dates, still missing, key dates, the log.",
        page: "app/(dashboard)/projects/[uuid]/page.tsx",
        components: ["components/projects/project-detail.tsx", "components/projects/mobily/mobily-workspace.tsx", "components/projects/mobily/step-row.tsx", "components/projects/mobily/permits-panel.tsx", "components/projects/mobily/lab-tests-panel.tsx", "components/projects/mobily/certificates-panel.tsx", "components/projects/mobily/key-dates-card.tsx"],
        actions: "projects/[uuid]/actions.ts · hooks projects/[uuid]/use-project-forms.ts",
        services: "projects.ts (getProjectDetail), mobily.ts, receivables.ts — rules in rules/mobily.ts",
        spec: "docs/mobily-workflow.md — rules 1–10",
      },
      {
        title: "STC project",
        route: "/projects/[uuid]",
        example: "stc",
        examplePath: (uuid) => `/projects/${uuid}`,
        does: "Design → M2 → M3 → M4 → M5 → dashboard: the move to the next stage gated by its rule, the 24-hour countdown, each document's parties and approvals, Supervisor/Inspector, ordered PAT, the Milestone with its C09 warning.",
        page: "app/(dashboard)/projects/[uuid]/page.tsx",
        components: ["components/projects/stc/stc-workspace.tsx", "components/projects/stc/documents-table.tsx", "components/projects/stc/party-decision.tsx", "components/projects/stc/countdown.tsx", "components/projects/stc/milestone-panel.tsx"],
        actions: "projects/[uuid]/actions.ts",
        services: "stc.ts — rules in rules/stc.ts",
        spec: "docs/stc-workflow.md — rules 1–8",
      },
    ],
  },
  {
    id: "procurement",
    title: "Procurement",
    summary: "From the purchase request to the received goods and the evaluated supplier.",
    pages: [
      {
        title: "Purchase requests",
        route: "/procurement/requests",
        href: "/procurement/requests",
        does: "Requests by stage: waiting approval, RFQ, ordered, closed — with the role each one waits for.",
        page: "app/(dashboard)/procurement/requests/page.tsx",
        components: ["components/procurement/purchase-request-tabs.tsx", "components/procurement/purchase-requests-table.tsx"],
        services: "procurement.ts (listPurchaseRequests)",
        spec: "Procurement §1 steps 1–8",
      },
      {
        title: "New purchase request",
        route: "/procurement/requests/new",
        href: "/procurement/requests/new",
        does: "Project, department, budget category and the items with quantity, estimated price and date.",
        page: "app/(dashboard)/procurement/requests/new/page.tsx",
        components: ["components/procurement/new-purchase-request.tsx", "components/procurement/purchase-request-form.tsx"],
        actions: "procurement/requests/new/actions.ts · use-request-form.ts",
        services: "procurement.ts (createPurchaseRequest)",
        spec: "§1 step 1",
      },
      {
        title: "Purchase request",
        route: "/procurement/requests/[uuid]",
        example: "pr",
        examplePath: (uuid) => `/procurement/requests/${uuid}`,
        does: "The one next step: direct manager (with the budget check) → procurement's stock check → stock chain or RFQ (comparison, three-supplier rule) → quotation approval by six → the PO.",
        page: "app/(dashboard)/procurement/requests/[uuid]/page.tsx",
        components: ["components/procurement/purchase-request-view.tsx", "components/procurement/request-stage-card.tsx", "components/procurement/procurement-review.tsx", "components/procurement/quotations-panel.tsx", "components/procurement/quotation-comparison-table.tsx"],
        actions: "procurement/requests/[uuid]/actions.ts · use-request-forms.ts",
        services: "procurement.ts, budgets.ts (budgetBlocker), rules/procurement.ts (rfqBlocker)",
        spec: "§1 steps 1–7",
      },
      {
        title: "Purchase orders",
        route: "/procurement/orders",
        href: "/procurement/orders",
        does: "POs with supplier, project, total, status, expected delivery and a Late flag.",
        page: "app/(dashboard)/procurement/orders/page.tsx",
        components: ["components/procurement/purchase-order-tabs.tsx", "components/procurement/purchase-orders-table.tsx"],
        services: "procurement.ts (listPurchaseOrders)",
        spec: "§1 steps 7–9",
      },
      {
        title: "Purchase order",
        route: "/procurement/orders/[uuid]",
        example: "po",
        examplePath: (uuid) => `/procurement/orders/${uuid}`,
        does: "The PO document (company and supplier, lines, VAT, terms) → six approvals → sent by e-mail → goods received with QC → supplier evaluation. Advances, cancellation, receipts.",
        page: "app/(dashboard)/procurement/orders/[uuid]/page.tsx",
        components: ["components/procurement/purchase-order-view.tsx", "components/procurement/purchase-order-document.tsx", "components/procurement/goods-receipt-form.tsx", "components/procurement/supplier-evaluation-form.tsx"],
        actions: "procurement/orders/[uuid]/actions.ts · use-order-forms.ts",
        services: "procurement.ts (decidePurchaseOrder, sendPurchaseOrder, receiveGoods, evaluateSupplier)",
        spec: "§1 steps 7–13 · §2 receiving",
      },
      {
        title: "Suppliers",
        route: "/procurement/suppliers",
        href: "/procurement/suppliers",
        does: "Register with VAT, CR, contact, POs and rating; a duplicate name or VAT number is refused.",
        page: "app/(dashboard)/procurement/suppliers/page.tsx",
        components: ["components/procurement/suppliers-board.tsx", "components/procurement/suppliers-table.tsx", "components/procurement/supplier-form.tsx"],
        actions: "procurement/suppliers/actions.ts · use-supplier-form.ts",
        services: "suppliers.ts (listSuppliers, createSupplier)",
        spec: "§1 step 13 · Finance §1 input controls",
      },
    ],
  },
  {
    id: "warehouse",
    title: "Warehouse",
    summary: "Balances, the item card, and every document that moves stock.",
    pages: [
      {
        title: "Stock",
        route: "/warehouse/stock",
        href: "/warehouse/stock",
        does: "Balance per warehouse at average cost, items under their reorder level, and Add item.",
        page: "app/(dashboard)/warehouse/stock/page.tsx",
        components: ["components/warehouse/stock-stats.tsx", "components/warehouse/stock-table.tsx", "components/warehouse/item-form.tsx"],
        actions: "warehouse/stock/actions.ts · use-item-form.ts",
        services: "warehouse.ts (listStock, createItem)",
        spec: "Procurement §6 — stock balance, items under reorder",
      },
      {
        title: "Item card",
        route: "/warehouse/items/[uuid]",
        example: "item",
        examplePath: (uuid) => `/warehouse/items/${uuid}`,
        does: "Every movement of the item with its reference, signed quantity, cost and running balance.",
        page: "app/(dashboard)/warehouse/items/[uuid]/page.tsx",
        components: ["components/warehouse/item-card-view.tsx", "components/warehouse/item-movements-table.tsx"],
        services: "warehouse.ts (getItemCard)",
        spec: "§6 — item card",
      },
      {
        title: "Warehouse documents",
        route: "/warehouse/documents",
        href: "/warehouse/documents",
        does: "Issue requests, transfers, stocktakes and write-offs together, with who each waits for; links to create each kind.",
        page: "app/(dashboard)/warehouse/documents/page.tsx",
        components: ["components/warehouse/documents-table.tsx", "components/warehouse/new-document-links.tsx"],
        services: "warehouse.ts (listWarehouseDocuments)",
        spec: "§3 · §5",
      },
      {
        title: "Issue request",
        route: "/warehouse/issue-requests/[uuid]",
        example: "issue",
        examplePath: (uuid) => `/warehouse/issue-requests/${uuid}`,
        does: "Region PM approval → issue with the recipient's signature → the three signatures; a fixed asset becomes custody on the employee. New: /warehouse/issue-requests/new.",
        page: "app/(dashboard)/warehouse/issue-requests/[uuid]/page.tsx",
        components: ["components/warehouse/issue-request-view.tsx", "components/warehouse/issue-stock-form.tsx", "components/warehouse/issue-signatures.tsx"],
        actions: "warehouse/issue-requests/[uuid]/actions.ts · new/actions.ts",
        services: "warehouse.ts (createIssueRequest, decideIssueRequest, issueStock)",
        spec: "§3 steps 1–4",
      },
      {
        title: "Transfer",
        route: "/warehouse/transfers/[uuid]",
        example: "transfer",
        examplePath: (uuid) => `/warehouse/transfers/${uuid}`,
        does: "Between warehouses through five approvals; the balance moves on the last one. New: /warehouse/transfers/new.",
        page: "app/(dashboard)/warehouse/transfers/[uuid]/page.tsx",
        components: ["components/warehouse/transfer-view.tsx", "components/warehouse/transfer-form.tsx"],
        actions: "warehouse/transfers/[uuid]/actions.ts · new/actions.ts",
        services: "warehouse.ts (createTransfer, decideTransfer)",
        spec: "§5 — transfers",
      },
      {
        title: "Stocktake",
        route: "/warehouse/stocktakes/[uuid]",
        example: "stocktake",
        examplePath: (uuid) => `/warehouse/stocktakes/${uuid}`,
        does: "Book vs actual vs difference; the COO's approval posts the adjustments. New: /warehouse/stocktakes/new.",
        page: "app/(dashboard)/warehouse/stocktakes/[uuid]/page.tsx",
        components: ["components/warehouse/stocktake-view.tsx", "components/warehouse/stocktake-lines-table.tsx"],
        actions: "warehouse/stocktakes/[uuid]/actions.ts · new/actions.ts",
        services: "warehouse.ts (createStocktake, decideStocktake)",
        spec: "§5 — periodic stocktake",
      },
      {
        title: "Write-off",
        route: "/warehouse/write-offs/[uuid]",
        example: "writeOff",
        examplePath: (uuid) => `/warehouse/write-offs/${uuid}`,
        does: "Damage, loss or theft: investigation, write off or charge an employee, six approvals. New: /warehouse/write-offs/new.",
        page: "app/(dashboard)/warehouse/write-offs/[uuid]/page.tsx",
        components: ["components/warehouse/write-off-view.tsx", "components/warehouse/write-off-form.tsx"],
        actions: "warehouse/write-offs/[uuid]/actions.ts · new/actions.ts",
        services: "warehouse.ts (createWriteOff, decideWriteOff)",
        spec: "§3 special cases · §5 write-off",
      },
      {
        title: "Asset custody",
        route: "/warehouse/custody",
        href: "/warehouse/custody",
        does: "Fixed assets held by employees: the count frequency, the next count (red when overdue), record a count, close as returned / lost / damaged.",
        page: "app/(dashboard)/warehouse/custody/page.tsx",
        components: ["components/warehouse/asset-custody-table.tsx", "components/warehouse/asset-custody-actions.tsx"],
        actions: "warehouse/custody/actions.ts",
        services: "warehouse.ts (listAssetCustodies, countAssetCustody, closeAssetCustody)",
        spec: "§3 step 1 — periodic custody count",
      },
    ],
  },
  {
    id: "custody",
    title: "Custody",
    summary: "Cash given to employees, its settlement, and clearance.",
    pages: [
      {
        title: "Cash custody",
        route: "/custody",
        href: "/custody",
        does: "Every cash custody: employee, project, amount, status, who it waits for, days open. New: /custody/new.",
        page: "app/(dashboard)/custody/page.tsx",
        components: ["components/custody/cash-custody-stats.tsx", "components/custody/cash-custody-table.tsx"],
        services: "custody.ts (listCashCustodies, createCashCustody)",
        spec: "Procurement §4",
      },
      {
        title: "Cash custody receipt",
        route: "/custody/[uuid]",
        example: "custody",
        examplePath: (uuid) => `/custody/${uuid}`,
        does: "The signed receipt form, six approvals, disbursement, then settlement (spent / returned).",
        page: "app/(dashboard)/custody/[uuid]/page.tsx",
        components: ["components/custody/cash-custody-view.tsx", "components/custody/custody-receipt.tsx", "components/custody/settle-form.tsx"],
        actions: "custody/[uuid]/actions.ts · use-settle-form.ts",
        services: "custody.ts (decideCashCustody, disburseCashCustody, settleCashCustody)",
        spec: "§4 steps 1–3",
      },
      {
        title: "Employees & clearance",
        route: "/custody/employees",
        href: "/custody/employees",
        does: "Custody per employee, and clearance — refused, with the reasons, until every custody is settled.",
        page: "app/(dashboard)/custody/employees/page.tsx",
        components: ["components/custody/employee-custody-table.tsx", "components/custody/employee-clearance.tsx"],
        actions: "custody/employees/actions.ts · use-clearance-form.ts",
        services: "custody.ts (listEmployeeCustody, approveClearance)",
        spec: "§4 step 4",
      },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    summary: "What the company owes and is owed, project budgets, and closing the month.",
    pages: [
      {
        title: "Supplier invoices",
        route: "/finance/payables",
        href: "/finance/payables",
        does: "Every supplier invoice with net payable, paid, outstanding and due date. Register: /finance/payables/new (mandatory fields, duplicates, VAT and three-way match checked).",
        page: "app/(dashboard)/finance/payables/page.tsx",
        components: ["components/finance/payables-stats.tsx", "components/finance/supplier-invoices-table.tsx", "components/finance/supplier-invoice-form.tsx"],
        actions: "finance/payables/new/actions.ts",
        services: "payables.ts (listSupplierInvoices, registerSupplierInvoice), rules/finance.ts",
        spec: "docs/finance.md §1",
      },
      {
        title: "Supplier invoice",
        route: "/finance/payables/[uuid]",
        example: "invoice",
        examplePath: (uuid) => `/finance/payables/${uuid}`,
        does: "Three-way match, advance recovered, approval, payments with the time the notice was e-mailed.",
        page: "app/(dashboard)/finance/payables/[uuid]/page.tsx",
        components: ["components/finance/supplier-invoice-detail.tsx", "components/finance/three-way-match-card.tsx", "components/finance/payment-form.tsx"],
        actions: "finance/payables/[uuid]/actions.ts · use-payment-form.ts",
        services: "payables.ts (approveSupplierInvoice, recordSupplierPayment)",
        spec: "§1 steps 3–8",
      },
      {
        title: "Supplier statement",
        route: "/finance/payables/statement/[supplierUuid]",
        example: "supplier",
        examplePath: (uuid) => `/finance/payables/statement/${uuid}`,
        does: "Invoices, advances and payments with the running balance, to reconcile with the supplier's own statement.",
        page: "app/(dashboard)/finance/payables/statement/[supplierUuid]/page.tsx",
        components: ["components/finance/supplier-statement.tsx"],
        services: "payables.ts (supplierStatement)",
        spec: "§1 step 9",
      },
      {
        title: "Due schedule & ageing",
        route: "/finance/schedule",
        href: "/finance/schedule",
        does: "The weekly due schedule, supplier ageing and customer ageing.",
        page: "app/(dashboard)/finance/schedule/page.tsx",
        components: ["components/finance/due-schedule.tsx", "components/finance/supplier-ageing.tsx", "components/finance/customer-ageing.tsx"],
        services: "payables.ts (weeklyDueSchedule, supplierAgeing), receivables.ts (customerAgeing)",
        spec: "§1 step 6 · reports",
      },
      {
        title: "Subcontractors",
        route: "/finance/subcontracts",
        href: "/finance/subcontracts",
        does: "Subcontracts with value, retention, certified, advance and materials pending deduction; new subcontract.",
        page: "app/(dashboard)/finance/subcontracts/page.tsx",
        components: ["components/finance/subcontracts-table.tsx", "components/finance/subcontract-form.tsx", "components/finance/subcontractors-list.tsx"],
        actions: "finance/subcontracts/actions.ts · use-subcontract-form.ts",
        services: "subcontractors.ts (listSubcontracts, createSubcontract)",
        spec: "§2",
      },
      {
        title: "Subcontractor statement",
        route: "/finance/subcontracts/statement/[subcontractorUuid]",
        example: "subcontractor",
        examplePath: (uuid) => `/finance/subcontracts/statement/${uuid}`,
        does: "A subcontractor's extracts with gross, retention, materials, net and paid.",
        page: "app/(dashboard)/finance/subcontracts/statement/[subcontractorUuid]/page.tsx",
        components: ["components/finance/subcontractor-statement.tsx"],
        services: "subcontractors.ts (subcontractorStatement)",
        spec: "§2 reports",
      },
      {
        title: "Extract",
        route: "/finance/extracts/[uuid]",
        example: "extract",
        examplePath: (uuid) => `/finance/extracts/${uuid}`,
        does: "Executed quantities and the deductions waterfall (advance, retention, penalties, materials issued) through engineer → projects manager → finance. List: /finance/extracts · New: /finance/extracts/new.",
        page: "app/(dashboard)/finance/extracts/[uuid]/page.tsx",
        components: ["components/finance/extract-detail.tsx", "components/finance/deductions-waterfall.tsx", "components/finance/extract-decision-form.tsx"],
        actions: "finance/extracts/[uuid]/actions.ts · use-extract-decision-form.ts",
        services: "subcontractors.ts (getExtract, decideExtract, markExtractPaid), rules/finance.ts (extractFigures)",
        spec: "§2 steps 1–7",
      },
      {
        title: "Customer invoices",
        route: "/finance/receivables",
        href: "/finance/receivables",
        does: "Mobily certificate invoices and STC as-built invoices with collection and overdue flags; issue an as-built tax invoice.",
        page: "app/(dashboard)/finance/receivables/page.tsx",
        components: ["components/finance/customer-invoices-table.tsx", "components/finance/as-built-invoice-form.tsx", "components/finance/invoice-collection-form.tsx"],
        actions: "finance/receivables/actions.ts · use-receivable-forms.ts",
        services: "receivables.ts (listCustomerInvoices, createAsBuiltInvoice, recordCustomerCollection)",
        spec: "§3",
      },
      {
        title: "Project budgets",
        route: "/finance/budgets",
        href: "/finance/budgets",
        does: "Planned, reserved, committed, spent and remaining per project; each opens budget vs actual, the lines editor, approval and revisions.",
        page: "app/(dashboard)/finance/budgets/page.tsx · [projectUuid]/page.tsx",
        components: ["components/finance/budgets-table.tsx", "components/finance/budget-detail.tsx", "components/finance/budget-usage-table.tsx", "components/finance/budget-lines-form.tsx"],
        actions: "finance/budgets/[projectUuid]/actions.ts · use-budget-lines-form.ts",
        services: "budgets.ts (listBudgets, getBudget, saveBudgetLines, approveBudget)",
        spec: "§4",
      },
      {
        title: "Monthly closing",
        route: "/finance/closing",
        href: "/finance/closing",
        does: "The nine-item checklist per month; two items only tick when nothing is open; the finance manager closes the period.",
        page: "app/(dashboard)/finance/closing/page.tsx",
        components: ["components/finance/closing-periods.tsx", "components/finance/closing-period-card.tsx"],
        actions: "finance/closing/actions.ts",
        services: "closing.ts (listClosingPeriods, tickClosingItem, closePeriod)",
        spec: "§5",
      },
      {
        title: "VAT summary",
        route: "/finance/vat",
        href: "/finance/vat",
        does: "Output VAT, input VAT and the net per month.",
        page: "app/(dashboard)/finance/vat/page.tsx",
        components: ["components/finance/vat-summary.tsx"],
        services: "receivables.ts (vatSummary)",
        spec: "§8",
      },
    ],
  },
  {
    id: "system",
    title: "System",
    summary: "The audit log, the demo data and this guide.",
    pages: [
      {
        title: "Activity log",
        route: "/activity",
        href: "/activity",
        does: "Every change: when, which record, what happened, who. Searchable.",
        page: "app/(dashboard)/activity/page.tsx",
        components: ["components/activity/activity-list.tsx", "components/activity/activity-table.tsx"],
        services: "activity.ts (listActivity)",
        spec: "Every document's log requirement",
      },
      {
        title: "Settings",
        route: "/settings",
        href: "/settings",
        does: "Reset demo data (system admin) and the staff directory behind the user switcher.",
        page: "app/(dashboard)/settings/page.tsx",
        components: ["components/settings/staff-directory.tsx"],
        actions: "settings/actions.ts",
        services: "activity.ts (resetDemoData), staff.ts",
        spec: "—",
      },
      {
        title: "Project guide",
        route: "/guide",
        href: "/guide",
        does: "This page.",
        page: "app/(dashboard)/guide/page.tsx",
        components: ["components/guide/guide-contents.tsx", "components/guide/guide-section.tsx", "components/guide/guide-layers.tsx", "components/guide/guide-rules.tsx"],
        services: "lib/guide.ts (the content), services list reads for the example links",
        spec: "—",
      },
    ],
  },
];

export const GUIDE_RULES: GuideRule[] = [
  { rule: "Mobily 1 — mobilization needs the PO", where: "rules/mobily.ts · mobilyStepBlocker", test: "rules/mobily.test.ts" },
  { rule: "Mobily 2 — permit end date computed", where: "rules/mobily.ts · permitExpiry", test: "rules/mobily.test.ts" },
  { rule: "Mobily 3 — lab tests; PAT waits for both labs", where: "rules/mobily.ts · labTestsPassed", test: "rules/mobily.test.ts" },
  { rule: "Mobily 4 — no Remedy before the Oil Sheet", where: "rules/mobily.ts · mobilyStepBlocker", test: "rules/mobily.test.ts" },
  { rule: "Mobily 5 — no PAC before RFS", where: "rules/mobily.ts · mobilyStepBlocker", test: "rules/mobily.test.ts · projects.test.ts" },
  { rule: "Mobily 6 — FAC after RFS + PAC + 1 year", where: "rules/mobily.ts · facEligibleAt", test: "rules/mobily.test.ts" },
  { rule: "Mobily 7 — invoice only after its certificate", where: "rules/mobily.ts · certificateInvoiceBlocker", test: "rules/mobily.test.ts · projects.test.ts" },
  { rule: "Mobily 8 — payment 60 days after I-Supplier", where: "rules/mobily.ts · invoiceDueAt", test: "rules/mobily.test.ts" },
  { rule: "Mobily 9 — Final Clearance two years later", where: "rules/mobily.ts · finalClearanceDueAt", test: "rules/mobily.test.ts" },
  { rule: "Mobily 10 — PO closure after all certificates", where: "rules/mobily.ts · mobilyStepBlocker", test: "rules/mobily.test.ts" },
  { rule: "STC 1 — 24 h after the design End Date", where: "rules/stc.ts · stcAdvanceBlocker", test: "rules/stc.test.ts" },
  { rule: "STC 2 — M2 End Date from documents 1 and 2", where: "rules/stc.ts · m2EndDateDue", test: "rules/stc.test.ts · projects.test.ts" },
  { rule: "STC 3 — Baladiyah not a condition", where: "rules/stc.ts · m2EndDateDue", test: "rules/stc.test.ts" },
  { rule: "STC 4 — implementation after the Inspector", where: "rules/stc.ts · stcAdvanceBlocker", test: "rules/stc.test.ts" },
  { rule: "STC 5 — Milestone needs both approvals", where: "rules/stc.ts · milestoneApprovalBlocker", test: "rules/stc.test.ts" },
  { rule: "STC 6 — auto-reject without C09", where: "rules/stc.ts · milestoneNeedsC09 · stc.ts approveStcMilestone", test: "rules/stc.test.ts · projects.test.ts" },
  { rule: "STC 7 — M4 after PAT and M3", where: "rules/stc.ts · stcAdvanceBlocker", test: "rules/stc.test.ts" },
  { rule: "STC 8 — dashboard only when all approved", where: "rules/stc.ts · stcAdvanceBlocker", test: "rules/stc.test.ts" },
  { rule: "PR within the budget at approval", where: "budgets.ts · budgetBlocker", test: "procurement.test.ts" },
  { rule: "Three suppliers or a previously approved quotation", where: "rules/procurement.ts · rfqBlocker", test: "procurement.test.ts" },
  { rule: "Approval chains in order; one rejection ends it", where: "core/approvals.ts · decide", test: "core/approvals.test.ts" },
  { rule: "No new cash custody until the old is settled", where: "custody.ts · openCustodyBlocker", test: "procurement.test.ts" },
  { rule: "Clearance only when every custody is settled", where: "custody.ts · clearanceBlockers", test: "procurement.test.ts" },
  { rule: "No duplicate supplier, invoice number or bad VAT", where: "suppliers.ts · rules/finance.ts", test: "procurement.test.ts · finance.test.ts" },
  { rule: "Three-way match; advance recovered automatically", where: "rules/finance.ts · threeWayMatch, advanceToRecover", test: "finance.test.ts" },
  { rule: "Extract deductions", where: "rules/finance.ts · extractFigures", test: "finance.test.ts" },
  { rule: "A month closes only when its checklist is complete", where: "closing.ts · tickClosingItem, closePeriod", test: "finance.test.ts" },
];
