# Project guide

A map of the whole MVP: every page, what it does, which files build it, which
business functions it calls, and which section of the four specification
documents it implements. Read section 1 once; after that, jump to the module you
are working on.


**Contents**

1. [The big picture](#1-the-big-picture)
2. [Repository map](#2-repository-map)
3. [One request, end to end](#3-one-request-end-to-end)
4. [Every page](#4-every-page)
   - [4.1 Overview](#41-overview) · [4.2 Projects](#42-projects) · [4.3 Procurement](#43-procurement) · [4.4 Warehouse](#44-warehouse) · [4.5 Custody](#45-custody) · [4.6 Finance](#46-finance) · [4.7 System](#47-system)
5. [Every business rule, and its test](#5-every-business-rule-and-its-test)
6. [Roles and approval chains](#6-roles-and-approval-chains)
7. [The data](#7-the-data)
8. [Shared building blocks](#8-shared-building-blocks)
9. [How to add a page](#9-how-to-add-a-page)

---

## 1. The big picture

Every screen is built in the same five layers. Each layer only talks to the one
below it.

```
 Page            apps/admin/src/app/(dashboard)/<route>/page.tsx      lays out the screen
   │
 Component       apps/admin/src/components/<feature>/*.tsx            renders; calls a hook for any logic
   │  (forms call a Server Action through a hook: use-*.ts in the route folder)
 Server Action   apps/admin/src/app/(dashboard)/<route>/actions.ts    who is acting? valid input? → ONE service call
   │
 Service         packages/services/src/<area>.ts                      the business operation
   │  checks →   packages/services/src/rules/<area>.ts               the rules, as pure functions
   │
 Store           db/index.ts  →  .data/store.json                     the data (the MVP's database)
```

- **Reads** skip the action: a page's async component calls a service read
  directly (`listProjects()`, `getPurchaseOrder(uuid)`).
- **Writes** always go page → form hook → action → service → `transact()`.
- **A locked button** shows the same rule text the service would throw — e.g.
  `mobilyStepBlocker()` in `rules/mobily.ts` returns *"A FAC request opens one
  year after the PAC certificate (rule 6)"*; the page shows it, and the service
  refuses with it if the request is sent anyway.

## 2. Repository map

| Path | What lives there |
| --- | --- |
| `apps/admin/` | The dashboard — every screen in this guide. Runs on :3001. |
| `apps/admin/src/app/(dashboard)/` | One folder per route: `page.tsx`, `actions.ts`, `use-*.ts` form hooks. |
| `apps/admin/src/components/` | Components, one folder per feature (`projects/`, `procurement/`, …), plus `shared/`, `forms/`, `layout/`. |
| `apps/admin/src/lib/` | App-wide helpers: `server/auth.ts` (who is acting), `server/run-action.ts` (the body of every action), `use-action-form.ts` (the form hook), `nav.tsx` (the sidebar), `entity-href.ts` (record → URL), `status-tones.ts` (status → colour). |
| `apps/client/` | Placeholder app for a later phase. One page. Runs on :3000. |
| `packages/services/src/` | All business logic. One file per area (listed in section 4). |
| `packages/services/src/rules/` | The rules as pure functions: `mobily.ts`, `stc.ts`, `procurement.ts`, `finance.ts`, `chains.ts`. |
| `packages/services/src/core/` | `approvals.ts` (the one approval-chain engine), `activity.ts` (the audit log), `stock.ts` (balances from movements), `roles.ts`, `tax.ts` (VAT 15 %), `company.ts`. |
| `packages/validators/src/` | zod schemas for every form: `projects.ts`, `procurement.ts`, `finance.ts`. |
| `packages/ui/src/` | Shared controls: `Button`, `Card`, `Table`, `StatTile`, `StatusPill`, `Dropdown`, `Input`, `DashboardSidebar`. |
| `packages/utils/src/` | Formatters and dates: `formatMoney`, `formatDate`, `daysUntil`, `addYears`, `nextDocumentNumber`. |
| `db/types.ts` | The schema — one type per table. |
| `db/enum.ts`, `db/label.ts` | Every status/kind list, and its display label. |
| `db/index.ts` | The store: `readStore()`, `transact()`, `resetStore()`. |
| `db/seed.ts`, `db/seed-more.ts`, `db/seed-activity.ts` | The demo data and its activity log. |
| `docs/` | The four specifications in English, and this guide. |

## 3. One request, end to end

**Approving PR-0001 as the direct manager:**

1. The user picks *Khalid Al-Harbi* in the top bar → `components/layout/user-switcher.tsx`
   → `lib/use-user-switcher.ts` → `switchUserAction` in `app/(dashboard)/actions.ts` sets the `erp_user` cookie.
2. `/procurement/requests/[uuid]` → `components/procurement/purchase-request-view.tsx`
   reads `getPurchaseRequest(uuid)` from `services/procurement.ts`, and asks
   `getCurrentStaff()` whether Khalid's role is the one the chain is waiting for.
3. Khalid clicks **Approve** in `components/shared/decision-form.tsx` →
   `lib/use-decision-form.ts` dispatches the bound action from
   `app/(dashboard)/procurement/requests/[uuid]/actions.ts`.
4. The action calls `runAction` (`lib/server/run-action.ts`): resolves Khalid,
   validates with `decisionSchema` (`validators/procurement.ts`), calls
   `decidePurchaseRequest()`.
5. `decidePurchaseRequest()` (`services/procurement.ts`) checks the budget with
   `budgetBlocker()` (`services/budgets.ts`), records the decision with `decide()`
   (`core/approvals.ts` — refuses anyone but the direct manager), moves the PR to
   *Procurement review*, and writes the log entry with `logActivity()` — all in one
   `transact()` (`db/index.ts`).
6. `runAction` revalidates; the page re-renders with the new status, the PR leaves
   Khalid's inbox and appears in procurement's.

## 4. Every page

Paths in the tables are relative to `apps/admin/src/` unless they start with
`packages/` or `db/`. *Spec* points at the English summaries in `docs/` (and so at
the matching section of the original PDF).

### 4.1 Overview

| Route | What it does | Page → main components | Actions | Services | Spec |
| --- | --- | --- | --- | --- | --- |
| `/` Dashboard | Six KPIs (each tile opens its page), what is waiting for you, the alerts, and every project's stage and missing items. | `app/(dashboard)/page.tsx` → `components/dashboard/kpi-row.tsx`, `approvals-panel.tsx`, `alerts-panel.tsx`, `project-pipeline.tsx` | — | `dashboard.ts` (`getDashboardSummary`, `listPendingApprovals`), `alerts.ts` (`listAlerts`), `projects.ts` (`listProjects`) | Mobily §7 (per-PO dashboard), STC §6 |
| `/approvals` My approvals | Every step whose turn belongs to your role. The system admin sees every role's queue, each item saying who it waits for. | `approvals/page.tsx` → `components/approvals/approvals-board.tsx`, `shared/approval-list.tsx` | — | `dashboard.ts` (`listPendingApprovals`) | Procurement §7 (notifications on pending requests) |
| `/alerts` Alerts | Urgent / coming up / information: permits about to expire, FAC opening, Final Clearance due, the STC 24 h wait, missing C09, late POs, items under reorder, overdue custody counts and settlements, unpaid customer invoices. | `alerts/page.tsx` → `components/alerts/alerts-board.tsx`, `shared/alert-list.tsx` | — | `alerts.ts` (`listAlerts` and its collectors) | Mobily §7, STC §6, Procurement §1/§3, Finance §3 |
| Top bar (every page) | Date, urgent-alerts bell, the acting user and **Switch user** — the stand-in for sign-in. | `components/layout/shell.tsx`, `navbar.tsx`, `user-switcher.tsx`; `app/(dashboard)/layout.tsx` | `app/(dashboard)/actions.ts` (`switchUserAction`) | `staff.ts` | — |
| Sidebar (every page) | The menu, with live counts on *My approvals* and *Alerts*. | `packages/ui/src/dashboard-sidebar.tsx`, `lib/nav.tsx` | — | — | — |

### 4.2 Projects

| Route | What it does | Page → main components | Actions | Services | Spec |
| --- | --- | --- | --- | --- | --- |
| `/projects` | Every Mobily and STC site: PO, current stage with progress, what is missing, PM. Tabs All / Mobily / STC and search. | `projects/page.tsx` → `components/projects/projects-table.tsx` | — | `projects.ts` (`listProjects`) | Mobily §7, STC §6 |
| `/projects/new` | Create a project; it starts at Mobily's design request or STC's Design. | `projects/new/page.tsx` → `components/projects/project-form.tsx`; hook `projects/new/use-project-form.ts` | `projects/new/actions.ts` (`createProjectAction`) | `projects.ts` (`createProject`) | — |
| `/projects/[uuid]` — **Mobily** | The 13-stage cycle: a stepper, then each stage with its steps (done · locked with the rule · or a form to record it). Permits with computed expiry; lab tests; certificates linked to their I-Supplier invoices and due dates; *Still missing*; *Key dates* (FAC = PAC + 1 year, Final Clearance = Stage 2 + 2 years); the project's log. | `projects/[uuid]/page.tsx` → `components/projects/project-detail.tsx` → `mobily/mobily-workspace.tsx`, `mobily/step-row.tsx`, `mobily/permits-panel.tsx`, `mobily/lab-tests-panel.tsx`, `mobily/certificates-panel.tsx`, `mobily/key-dates-card.tsx`, `missing-card.tsx`, `stage-stepper.tsx`, `stage-section.tsx`; hooks `projects/[uuid]/use-project-forms.ts` | `projects/[uuid]/actions.ts` (`recordMobilyStepAction`, `addPermitAction`, `issuePermitAction`, `addLabTestAction`, `labTestResultAction`, `certificateInvoiceAction`, `collectInvoiceAction`) | `projects.ts` (`getProjectDetail`), `mobily.ts`, `receivables.ts` (`recordCustomerCollection`), rules in `rules/mobily.ts` | `docs/mobily-workflow.md` — all stages, rules 1–10 |
| `/projects/[uuid]` — **STC** | Design → M2 → M3 → M4 → M5 → dashboard. *Move to next stage* gated by the stage's rule; the 24-hour countdown; each document with its responsible parties and their approve/reject; send to Supervisor and Inspector assignment; ordered PAT steps; site checks; the Milestone with its C09 warning and both approvals; stage history. | same page → `stc/stc-workspace.tsx`, `stc/design-panel.tsx`, `stc/countdown.tsx`, `stc/documents-table.tsx`, `stc/party-decision.tsx`, `stc/upload-form.tsx`, `stc/stc-step-row.tsx`, `stc/inspector-form.tsx`, `stc/milestone-panel.tsx`, `stc/milestone-flags-form.tsx` | same file (`recordDesignAction`, `advanceStageAction`, `uploadDocumentAction`, `decideDocumentPartyAction`, `sendToSupervisorAction`, `assignInspectorAction`, `stcStepAction`, `milestoneFlagsAction`, `approveMilestoneAction`, `resubmitMilestoneAction`) | `stc.ts`, rules in `rules/stc.ts` | `docs/stc-workflow.md` — all stages, rules 1–8 |

**Demo projects:** MOB-001 Implementation · MOB-002 Certificates (FAC in 15 days) ·
MOB-003 Design request · MOB-004 Site HO · MOB-005 PCR & SDN · MOB-006 PO closed ·
STC-001 Design (countdown) · STC-004 M2 · STC-002 M3 (needs C09) · STC-005 M4 ·
STC-006 M5 · STC-003 on the dashboard.

### 4.3 Procurement

| Route | What it does | Page → main components | Actions | Services | Spec |
| --- | --- | --- | --- | --- | --- |
| `/procurement/requests` | Purchase requests by stage (waiting approval, RFQ, ordered, closed): project, estimate, status, who it waits for. | `procurement/requests/page.tsx` → `components/procurement/purchase-request-tabs.tsx`, `purchase-requests-table.tsx` | — | `procurement.ts` (`listPurchaseRequests`) | Procurement §1 steps 1–8 |
| `/procurement/requests/new` | Raise a PR: project, department, budget category, items with quantity, estimated price and date. | `procurement/requests/new/page.tsx` → `new-purchase-request.tsx`, `purchase-request-form.tsx`; hook `use-request-form.ts` | `procurement/requests/new/actions.ts` | `procurement.ts` (`createPurchaseRequest`) | §1 step 1 |
| `/procurement/requests/[uuid]` | One card for the next step of this PR: direct manager approval (with the budget reservation) → procurement review (system stock check; *Supply from stock* or *Purchase*) → stock-supply chain, or RFQ (quotation comparison, best price/delivery/terms/quality, three-supplier rule) → quotation approval by six → link to the PO. Lines with stock, facts, chains, log. | `procurement/requests/[uuid]/page.tsx` → `purchase-request-view.tsx`, `request-stage-card.tsx`, `procurement-review.tsx`, `quotations-panel.tsx`, `quotation-comparison-table.tsx`, `quotation-form.tsx`, `select-quotation-form.tsx`, `request-facts.tsx`, `request-lines-card.tsx`, `request-side.tsx`; hooks `use-request-forms.ts` | `procurement/requests/[uuid]/actions.ts` | `procurement.ts` (`getPurchaseRequest`, `decidePurchaseRequest`, `reviewPurchaseRequest`, `decideStockSupply`, `addQuotation`, `submitQuotationForApproval`, `decideQuotation`), `budgets.ts` (`budgetBlocker`), `rules/procurement.ts` | §1 steps 1–7 |
| `/procurement/orders` | POs: supplier, project, total, status, expected delivery with a *Late* flag, who it waits for. | `procurement/orders/page.tsx` → `purchase-order-tabs.tsx`, `purchase-orders-table.tsx` | — | `procurement.ts` (`listPurchaseOrders`) | §1 steps 7–9 |
| `/procurement/orders/[uuid]` | The PO as a document (company and supplier blocks, lines, net / VAT 15 % / total, delivery and terms). Next step: six approvals → send by e-mail → receive goods with QC (accepted / rejected with reason) → supplier evaluation. Receipt progress, receipts, advance paid vs recovered, cancellation, amendments, log. | `procurement/orders/[uuid]/page.tsx` → `purchase-order-view.tsx`, `purchase-order-document.tsx`, `order-stage-card.tsx`, `goods-receipt-form.tsx`, `receipt-progress-card.tsx`, `receipts-card.tsx`, `advance-card.tsx`, `cancel-order-form.tsx`, `supplier-evaluation-form.tsx`, `amendments-card.tsx`, `order-side.tsx`; hooks `use-order-forms.ts` | `procurement/orders/[uuid]/actions.ts` | `procurement.ts` (`getPurchaseOrder`, `decidePurchaseOrder`, `sendPurchaseOrder`, `receiveGoods`, `recordAdvancePayment`, `cancelPurchaseOrder`, `evaluateSupplier`), `rules/procurement.ts` (`goodsReceiptBlocker`, `receiptState`) | §1 steps 7–13, §1 other cases, §2 receiving |
| `/procurement/suppliers` | Supplier register with VAT, CR, contact, POs and rating; *Register supplier* refuses a duplicate name or VAT number. | `procurement/suppliers/page.tsx` → `suppliers-board.tsx`, `suppliers-table.tsx`, `supplier-form.tsx`; hook `use-supplier-form.ts` | `procurement/suppliers/actions.ts` | `suppliers.ts` (`listSuppliers`, `createSupplier`, `supplierDuplicateBlocker`) | §1 step 13, Finance §1 input controls |

### 4.4 Warehouse

| Route | What it does | Page → main components | Actions | Services | Spec |
| --- | --- | --- | --- | --- | --- |
| `/warehouse/stock` | Balance per warehouse, total, average cost and value; *Below reorder* flags; *Add item*. | `warehouse/stock/page.tsx` → `components/warehouse/stock-stats.tsx`, `stock-table.tsx`, `item-form.tsx`; hook `use-item-form.ts` | `warehouse/stock/actions.ts` | `warehouse.ts` (`listStock`, `createItem`) | Procurement §6 (stock balance, items under reorder level) |
| `/warehouse/items/[uuid]` | Item card: every movement with its reference, signed quantity, cost, who it was charged to and the running balance. | `warehouse/items/[uuid]/page.tsx` → `item-card-view.tsx`, `item-movements-table.tsx` | — | `warehouse.ts` (`getItemCard`) | §6 (item card) |
| `/warehouse/documents` | Issue requests, transfers, stocktakes and write-offs together, by kind, with who each waits for; links to create each. | `warehouse/documents/page.tsx` → `documents-table.tsx`, `new-document-links.tsx` | — | `warehouse.ts` (`listWarehouseDocuments`) | §3, §5 |
| `/warehouse/issue-requests/new` · `/[uuid]` | Issue request: project, warehouse, recipient (employee / subcontractor / cost center), lines, custody count frequency for fixed assets. Detail: region PM approval → *Issue stock* with the recipient's signature (storekeeper) → the three signatures. A fixed asset becomes custody on the employee. | `warehouse/issue-requests/new/page.tsx` → `new-issue-request.tsx`, `issue-request-form.tsx`; `[uuid]/page.tsx` → `issue-request-view.tsx`, `issue-stock-form.tsx`, `issue-signatures.tsx`, `approval-card.tsx` | `issue-requests/new/actions.ts`, `issue-requests/[uuid]/actions.ts` | `warehouse.ts` (`createIssueRequest`, `getIssueRequest`, `decideIssueRequest`, `issueStock`, `issueStockBlocker`) | §3 steps 1–4 |
| `/warehouse/transfers/new` · `/[uuid]` | Transfer between warehouses through five approvals; the balance moves on the last one. | `new-transfer.tsx`, `transfer-form.tsx`; `transfer-view.tsx` | `transfers/new/actions.ts`, `transfers/[uuid]/actions.ts` | `warehouse.ts` (`createTransfer`, `getTransfer`, `decideTransfer`) | §5 transfers |
| `/warehouse/stocktakes/new` · `/[uuid]` | Count a warehouse; book vs actual vs difference; the COO's approval posts the adjustments. | `new-stocktake.tsx`, `stocktake-form.tsx`; `stocktake-view.tsx`, `stocktake-lines-table.tsx` | `stocktakes/new/actions.ts`, `stocktakes/[uuid]/actions.ts` | `warehouse.ts` (`createStocktake`, `getStocktake`, `decideStocktake`) | §5 periodic stocktake |
| `/warehouse/write-offs/new` · `/[uuid]` | Damage, loss, theft or expiry: investigation, decision (write off / charge an employee), six approvals. | `new-write-off.tsx`, `write-off-form.tsx`; `write-off-view.tsx` | `write-offs/new/actions.ts`, `write-offs/[uuid]/actions.ts` | `warehouse.ts` (`createWriteOff`, `getWriteOff`, `decideWriteOff`) | §3 special cases, §5 write-off |
| `/warehouse/custody` | Fixed assets held by employees: count frequency, next count (red when overdue), *Record count*, close as returned / lost / damaged. | `warehouse/custody/page.tsx` → `asset-custody-table.tsx`, `asset-custody-actions.tsx` | `warehouse/custody/actions.ts` | `warehouse.ts` (`listAssetCustodies`, `countAssetCustody`, `closeAssetCustody`) | §3 step 1 (periodic custody count) |

### 4.5 Custody

| Route | What it does | Page → main components | Actions | Services | Spec |
| --- | --- | --- | --- | --- | --- |
| `/custody` | Cash custody: employee, project, amount, status, who it waits for, days open (red past 30). | `custody/page.tsx` → `components/custody/cash-custody-stats.tsx`, `cash-custody-table.tsx` | — | `custody.ts` (`listCashCustodies`) | Procurement §4 |
| `/custody/new` | Request custody: employee, project, budget category, city, work order, lines. Refused while the employee has unsettled custody on that project, or over budget. | `custody/new/page.tsx` → `new-cash-custody.tsx`, `cash-custody-form.tsx`; hook `use-cash-custody-form.ts` | `custody/new/actions.ts` | `custody.ts` (`createCashCustody`, `openCustodyBlocker`), `budgets.ts` | §4 steps 1, 3 |
| `/custody/[uuid]` | The signed receipt form (serial number, employee, city, date, work order, project, lines), six approvals, *Disburse*, then *Settle* (spent / returned). | `custody/[uuid]/page.tsx` → `cash-custody-view.tsx`, `custody-receipt.tsx`, `settle-form.tsx`; hook `use-settle-form.ts` | `custody/[uuid]/actions.ts` | `custody.ts` (`getCashCustody`, `decideCashCustody`, `disburseCashCustody`, `settleCashCustody`) | §4 steps 1–3 |
| `/custody/employees` | Custody statement per employee (open cash, assets held) and clearance — refused, with the reasons, until every custody is settled. | `custody/employees/page.tsx` → `employee-custody-table.tsx`, `employee-clearance.tsx`, `clearance-form.tsx`; hook `use-clearance-form.ts` | `custody/employees/actions.ts` | `custody.ts` (`listEmployeeCustody`, `approveClearance`, `clearanceBlockers`) | §4 step 4, §6 (custody per employee) |

### 4.6 Finance

| Route | What it does | Page → main components | Actions | Services | Spec |
| --- | --- | --- | --- | --- | --- |
| `/finance/payables` | Supplier invoices: net payable, paid, outstanding, due date (red when overdue), status; tiles for awaiting approval, approved unpaid, overdue. | `finance/payables/page.tsx` → `components/finance/payables-stats.tsx`, `supplier-invoices-table.tsx` | — | `payables.ts` (`listSupplierInvoices`) | `docs/finance.md` §1 |
| `/finance/payables/new` | Register an invoice against a PO and its receipts, with the expected net and VAT worked out; refused when VAT data is missing, the number is a duplicate, VAT is inconsistent or the three-way match fails. | `finance/payables/new/page.tsx` → `supplier-invoice-form-section.tsx`, `supplier-invoice-form.tsx`; hook `use-supplier-invoice-form.ts` | `finance/payables/new/actions.ts` | `payables.ts` (`listInvoiceableReceipts`, `registerSupplierInvoice`), `rules/finance.ts` | §1 mandatory fields, steps 1–5 |
| `/finance/payables/[uuid]` | Three-way match, amounts (advance recovered, net payable), approval (finance manager), payments with the time the notice was e-mailed. | `finance/payables/[uuid]/page.tsx` → `supplier-invoice-detail.tsx`, `three-way-match-card.tsx`, `invoice-amounts-card.tsx`, `payment-form.tsx`, `supplier-payments-table.tsx`, `supplier-card.tsx`; hook `use-payment-form.ts` | `finance/payables/[uuid]/actions.ts` | `payables.ts` (`getSupplierInvoice`, `approveSupplierInvoice`, `recordSupplierPayment`) | §1 steps 3–8 |
| `/finance/payables/statement/[supplierUuid]` | Supplier statement with running balance, for reconciling with the supplier's own. | `supplier-statement.tsx` | — | `payables.ts` (`supplierStatement`) | §1 step 9 |
| `/finance/schedule` | Weekly due schedule, supplier ageing, customer ageing. | `finance/schedule/page.tsx` → `due-schedule.tsx`, `supplier-ageing.tsx`, `customer-ageing.tsx`, `ageing-table.tsx` | — | `payables.ts` (`weeklyDueSchedule`, `supplierAgeing`), `receivables.ts` (`customerAgeing`) | §1 step 6, reports; §3 reports |
| `/finance/subcontracts` | Subcontracts (value, retention, certified, retention held, advance, materials pending deduction) and *New subcontract*; links to each subcontractor's statement. | `finance/subcontracts/page.tsx` → `subcontracts-section.tsx`, `subcontracts-table.tsx`, `subcontract-form-section.tsx`, `subcontractors-list.tsx`; hook `use-subcontract-form.ts` | `finance/subcontracts/actions.ts` | `subcontractors.ts` (`listSubcontracts`, `createSubcontract`) | §2 |
| `/finance/subcontracts/statement/[subcontractorUuid]` | Subcontractor statement: extracts, gross, retention, materials, net, paid. | `subcontractor-statement.tsx` | — | `subcontractors.ts` (`subcontractorStatement`) | §2 reports |
| `/finance/extracts` · `/new` · `/[uuid]` | Extracts of executed quantities. Detail: the deductions waterfall (gross − advance − retention − penalties − materials issued = net), engineer → projects manager → finance, penalties set at approval, *Mark paid*. | `extracts-section.tsx`, `extracts-table.tsx`; `extract-form-section.tsx`, `extract-form.tsx`; `extract-detail.tsx`, `deductions-waterfall.tsx`, `extract-decision-form.tsx`; hooks `use-extract-form.ts`, `use-extract-decision-form.ts` | `finance/extracts/new/actions.ts`, `finance/extracts/[uuid]/actions.ts` | `subcontractors.ts` (`listExtracts`, `submitExtract`, `getExtract`, `decideExtract`, `markExtractPaid`), `rules/finance.ts` (`extractFigures`) | §2 steps 1–7 |
| `/finance/receivables` | Customer invoices (Mobily certificates and STC as-built) with collection, overdue flags, and *Issue as-built tax invoice* for STC. | `finance/receivables/page.tsx` → `receivables-stats.tsx`, `customer-invoices-table.tsx`, `invoice-collection-form.tsx`, `as-built-invoice-section.tsx`; hooks `use-receivable-forms.ts` | `finance/receivables/actions.ts` | `receivables.ts` (`listCustomerInvoices`, `createAsBuiltInvoice`, `recordCustomerCollection`) | §3 |
| `/finance/budgets` · `/[projectUuid]` | Every project's budget: planned, reserved, committed, spent, remaining (red when over). Detail: budget vs actual per category, lines editor (a reason is required once approved), *Approve budget*, revisions log. | `budgets-table.tsx`; `budget-detail.tsx`, `budget-usage-table.tsx`, `budget-lines-form.tsx`, `budget-revisions.tsx`; hook `use-budget-lines-form.ts` | `finance/budgets/[projectUuid]/actions.ts` | `budgets.ts` (`listBudgets`, `getBudget`, `saveBudgetLines`, `approveBudget`, `budgetUsage`) | §4 |
| `/finance/closing` | The nine-item checklist per month; procurement/warehouse and custody can only be ticked when nothing is open; *Close period* (finance manager) once all are done. | `finance/closing/page.tsx` → `closing-periods.tsx`, `closing-period-card.tsx` | `finance/closing/actions.ts` | `closing.ts` (`listClosingPeriods`, `tickClosingItem`, `closePeriod`) | §5 |
| `/finance/vat` | Output VAT, input VAT and the net per month. | `finance/vat/page.tsx` → `vat-summary.tsx` | — | `receivables.ts` (`vatSummary`) | §8 |

### 4.7 System

| Route | What it does | Page → main components | Actions | Services | Spec |
| --- | --- | --- | --- | --- | --- |
| `/activity` | The audit log of every change: when, which record, what happened, who. Searchable. | `activity/page.tsx` → `components/activity/activity-list.tsx`, `activity-table.tsx` | — | `activity.ts` (`listActivity`) | Every document's "log" requirement |
| `/settings` | *Reset demo data* (system admin) and the staff directory behind the user switcher. | `settings/page.tsx` → `components/settings/staff-directory.tsx`, `shared/action-button.tsx` | `settings/actions.ts` (`resetDemoDataAction`) | `activity.ts` (`resetDemoData`), `staff.ts` | — |

## 5. Every business rule, and its test

| Rule (from the spec) | Enforced in | Test |
| --- | --- | --- |
| **Mobily 1** — mobilization needs the PO | `rules/mobily.ts` `mobilyStepBlocker` | `rules/mobily.test.ts` "rule 1" |
| **Mobily 2** — permit end date computed | `rules/mobily.ts` `permitExpiry` | "rule 2" |
| **Mobily 3** — lab test statuses; PAT waits for both labs | `rules/mobily.ts` `labTestsPassed` | "rule 3" |
| **Mobily 4** — no Remedy before the Oil Sheet | `mobilyStepBlocker` (`remedy_requested`) | "rule 4" |
| **Mobily 5** — no PAC before RFS | `mobilyStepBlocker` (`pac_submitted`) | "rule 5", `projects.test.ts` |
| **Mobily 6** — FAC after RFS + PAC + 1 year | `facEligibleAt`, `mobilyStepBlocker` | "rule 6" |
| **Mobily 7** — invoice only after its certificate | `certificateInvoiceBlocker` | "rule 7", `projects.test.ts` |
| **Mobily 8** — payment 60 days after I-Supplier | `invoiceDueAt` | "rule 8" |
| **Mobily 9** — Final Clearance two years later | `finalClearanceDueAt` | "rule 9" |
| **Mobily 10** — PO closure after all certificates | `mobilyStepBlocker` (`po_closure_submitted`) | "rule 10" |
| **STC 1** — 24 h after the design End Date | `rules/stc.ts` `stcAdvanceBlocker`, `designWaitEndsAt` | `rules/stc.test.ts` "rule 1" |
| **STC 2** — M2 End Date from documents 1 and 2 | `m2EndDateDue`; set in `stc.ts` `applyAutomaticDates` | "rule 2" |
| **STC 3** — Baladiyah not a condition | `m2EndDateDue` | "rule 3" |
| **STC 4** — implementation after the Inspector is assigned | `stcAdvanceBlocker` (m2) | "rule 4" |
| **STC 5** — Milestone needs Inspector + Supervisor | `milestoneApprovalBlocker`; `stc.ts` `approveStcMilestone` | "rule 5" |
| **STC 6** — auto-reject without C09 | `milestoneNeedsC09`; `approveStcMilestone` | "rule 6", `projects.test.ts` |
| **STC 7** — M4 after PAT complete and M3 closed | `stcAdvanceBlocker` (m3) | "rule 7" |
| **STC 8** — on the dashboard only when all approved | `stcAdvanceBlocker` (m5) | "rule 8" |
| PR fits the budget at approval | `budgets.ts` `budgetBlocker` | `procurement.test.ts` |
| Procurement stock check must match the system | `procurement.ts` `reviewPurchaseRequest` | `procurement.test.ts` |
| Three suppliers or a previously approved quotation | `rules/procurement.ts` `rfqBlocker` | `procurement.test.ts` |
| Each approval chain in order, one rejection ends it | `core/approvals.ts` `decide` | `core/approvals.test.ts` |
| Fixed assets become custody on an employee | `warehouse.ts` `issueStock` | `procurement.test.ts` |
| Transfer moves the balance on the last approval | `warehouse.ts` `decideTransfer` | `procurement.test.ts` |
| No new cash custody until the old one is settled | `custody.ts` `openCustodyBlocker` | `procurement.test.ts` |
| Clearance only when every custody is settled | `custody.ts` `clearanceBlockers` | `procurement.test.ts` |
| No duplicate supplier (name or VAT) | `suppliers.ts` `supplierDuplicateBlocker` | `procurement.test.ts` |
| Invoice number unique per supplier; VAT consistent | `rules/finance.ts` `duplicateInvoiceBlocker`, `vatBlocker` | `finance.test.ts` |
| Three-way match; advance recovered automatically | `rules/finance.ts` `threeWayMatch`, `advanceToRecover` | `finance.test.ts` |
| Extract deductions (advance, retention, penalties, materials) | `rules/finance.ts` `extractFigures`; `subcontractors.ts` | `finance.test.ts` |
| As-built invoiced only when approved | `receivables.ts` `createAsBuiltInvoice` | `finance.test.ts` |
| A period closes only when the checklist is complete | `closing.ts` `itemBlocker`, `closePeriod` | `finance.test.ts` |

All test files are under `packages/services/src/`; run them with `pnpm test`.

## 6. Roles and approval chains

The user switcher (foot of the sidebar) holds one person per role — `db/seed.ts`. The chains
are in `packages/services/src/rules/chains.ts`; `core/approvals.ts` enforces the order.

| Chain | Roles, in order | Used by |
| --- | --- | --- |
| Purchase request | Direct manager | `decidePurchaseRequest` |
| Stock supply | Region PM → Projects manager → Procurement | `decideStockSupply` |
| Quotation and PO | Region PM → Procurement → Projects manager → Finance manager → COO → Deputy GM | `decideQuotation`, `decidePurchaseOrder` |
| Issue request | Region PM | `decideIssueRequest` |
| Transfer | Storekeeper → Region accountant → Region PM → Projects manager → COO | `decideTransfer` |
| Stocktake differences | COO | `decideStocktake` |
| Write-off | Storekeeper → Region PM → Projects manager → Finance manager → COO → Deputy GM | `decideWriteOff` |
| Cash custody | Region accountant → Region PM → Projects manager → Finance manager → COO → Deputy GM | `decideCashCustody` |
| Subcontractor extract | Project engineer → Projects manager → Finance manager | `decideExtract` |

| Person | Role | What they do in the demo |
| --- | --- | --- |
| Nasser Al-Otaibi | System admin | Sees every queue; resets the demo data |
| Omar Al-Qahtani | Project manager | Records project steps, raises PRs, issue and custody requests |
| Khalid Al-Harbi | Direct manager | Approves purchase requests |
| Faisal Al-Shehri | Procurement | Reviews PRs, collects quotations, sends POs, evaluates suppliers |
| Majed Al-Dosari | Region project manager | First of most chains; approves issue requests |
| Yousef Al-Ghamdi | Projects manager | Chains; approves budgets |
| Huda Al-Zahrani | Finance manager | Chains; approves supplier invoices; closes the month |
| Abdullah Al-Mutairi | Operations manager (COO) | Chains; approves stocktakes |
| Saad Al-Anazi | Deputy GM | Last of the six-step chains |
| Turki Al-Shammari | Storekeeper | Receives goods, issues stock, counts, transfers |
| Reem Al-Juhani | Region accountant | First of cash custody and second of transfers |
| Saeed Al-Malki | Project engineer | First approval on extracts |
| Lama Al-Subaie | Accountant | Registers and pays invoices, disburses and settles custody, closing ticks |

## 7. The data

- **Schema:** `db/types.ts` — one type per table, collected in `Store` (projects,
  suppliers, items, warehouses, PRs, quotations, POs, receipts, stock movements,
  issue requests, asset and cash custody, transfers, stocktakes, write-offs,
  clearances, supplier invoices, subcontractors, subcontracts, extracts, customer
  invoices, budgets, closing periods, activity).
- **Stock** is never stored as a number: a balance is the sum of its movements
  (`core/stock.ts`), so the item card and the balance always agree.
- **The file:** `.data/store.json` at the repo root (gitignored). `pnpm db:reset` or
  *Settings → Reset demo data* rebuilds it.
- **The demo set:** `db/seed.ts` (the core the tests rely on), `db/seed-more.ts` (a
  record in every state of every screen), `db/seed-activity.ts` (the activity log,
  derived from those records). All dates are relative to the moment of the reset, so
  the alerts are always live.

## 8. Shared building blocks

| Block | File | Use |
| --- | --- | --- |
| Form hook | `lib/use-action-form.ts` | `useActionForm(schema, action, defaults)` — every form. |
| Form fields | `components/forms/` | `ActionForm`, `TextField`, `TextareaField`, `DropdownField`, `CheckboxField`, `LinesField` (repeatable rows). |
| Action body | `lib/server/run-action.ts` | `runAction(input, (actor, data) => service(...), { schema })`. |
| One-button action | `components/shared/action-button.tsx` | Shows the blocker text when locked. |
| Approve / reject | `components/shared/decision-form.tsx` | With "waiting for X" when it is not your turn. |
| Chain display | `components/shared/chain-timeline.tsx` | Each role, who decided, when. |
| Loading + errors | `components/shared/async-section.tsx` | Keyed Suspense + error boundary around every data section. |
| Page header | `components/shared/page-header.tsx` | Title, description, back link, primary action. |
| Theme | `app/globals.css` | Every colour as a token (`--color-primary`, `--color-sidebar`, …); no gradients. |

## 9. How to add a page

1. Business logic first: a function in `packages/services/src/<area>.ts` (and a rule
   in `rules/` with a test if it gates something). Export it from `index.ts`.
2. A zod schema in `packages/validators/src/` if it takes input.
3. `apps/admin/src/app/(dashboard)/<route>/page.tsx` — layout only, an
   `AsyncSection` around an async component.
4. The component(s) in `apps/admin/src/components/<feature>/`.
5. `actions.ts` beside the page: `runAction(...)` calling your one service function.
6. A `use-<thing>-form.ts` hook beside the page for each form.
7. A link in `lib/nav.tsx`, and a case in `lib/entity-href.ts` if records of it are
   linked from alerts or the log.

The full code-style rules are in `CLAUDE.md`.
