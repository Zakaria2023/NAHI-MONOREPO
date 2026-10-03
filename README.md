# NAHI — MVP

An ERP for a telecom fiber contractor building sites for **Mobily** and **STC**:
project workflows, procurement, warehouse, custody and finance, with every rule from
the four specification documents enforced and tested.

| App           | URL                   | What                                                    |
| ------------- | --------------------- | ------------------------------------------------------- |
| `apps/admin`  | http://localhost:3001 | The dashboard — every module and workflow               |
| `apps/client` | http://localhost:3000 | Placeholder for a later phase (no screens yet)          |

```bash
pnpm install
pnpm dev:admin   # the dashboard on :3001  (pnpm dev runs both apps)
pnpm test        # the business-rule tests
pnpm db:reset    # rebuild the demo data
```

## MVP scope

- **No database.** All data is in `.data/store.json` (created from `db/seed.ts` on first
  run). `db/types.ts` is the schema; `db/index.ts` is the only code that touches the
  file, and it is what MySQL + Drizzle will replace.
- **No auth provider, no sign-in.** The user menu in the navbar switches between the
  admin and the employees (the other roles fold away under it, to walk approval chains).
  The admin sees the whole company; an employee sees only their own dashboard and tasks.
  Every employee added on the New employee page gets an account and joins the menu.
  `apps/admin/src/lib/server/auth.ts` is where Clerk will go.
- **No file storage.** Uploading a document records its file name.

## Modules

| Area | Screens | Spec |
| --- | --- | --- |
| Projects | Mobily's 13 stages, STC's stages, permits, lab tests, documents and approvals, certificates and invoices | `docs/mobily-workflow.md`, `docs/stc-workflow.md` |
| Procurement | Purchase requests, RFQs and comparison, quotation and PO approval, POs (modify, late penalty, advance), receiving, annual contracts, returns and debit notes, suppliers | `docs/procurement-warehouse-custody.md` §1–2 |
| Warehouse | Stock and item cards, issue requests, asset custody, transfers, stocktakes, write-offs | §2–5 |
| Custody | Cash custody, employee statements and clearance | §4 |
| HR & payroll | Employees, timesheets and daily-worker attendance, payroll runs, payslips, bank file, GOSI, labour cost per project | `docs/finance.md` §6 |
| Payables & receivables | Supplier invoices, due schedule and ageing, supplier statement matching, subcontractors and extracts, customer invoices and collections | `docs/finance.md` §1–3 |
| Treasury | Bank accounts and reconciliation, cheques (post-dated, cleared, bounced), letters of guarantee and retentions | `docs/finance.md` |
| Cost control | Project budgets with the study, timelines and variance; expenses and cost centres; overhead allocation | `docs/finance.md` §4 |
| Accounting | Fixed assets and depreciation, monthly closing, VAT by month and quarter, tax and insurance calendar | `docs/finance.md` §5, §7–8 |
| Reports | Every report the documents list, with Excel export and print / PDF — including the derived general ledger, trial balance, income statement, balance sheet and zakat estimate | all |
| Tasks | Give tasks to anyone; seen / not seen, started, days worked and hours logged, checklist, hand-in and review, comments, history; team workload and task reports | `docs/tasks.md` |
| Overview | Company-wide dashboard (every area's key figures), my approvals, alerts, activity log; an employee's own dashboard | all |

## Demo walkthrough

1. **Dashboard** — the KPIs, what is waiting for you, the alerts (a permit expiring in 5
   days, FAC opening in 15, a late PO, an overdue invoice) and the project pipeline.
2. **MOB-001** — Implementation is open; every later step shows the rule that locks it.
   Record *MH installation*, then try PAT: it waits for the Mobily Laboratory test.
3. **MOB-002** — RFS and PAC are in; FAC is locked until a year after PAC (rule 6), and
   the PAC invoice falls due 60 days after I-Supplier (rule 8).
4. **STC-001** — the 24-hour countdown after the design End Date (rule 1).
5. **STC-004** — approve *Permit Receipt* as STC: the M2 End Date appears (rule 2), with
   Baladiyah still pending (rule 3).
6. **STC-002** — approve the Milestone without a C09: it is rejected automatically (rule 6).
7. **PR-0001** — switch user to *Khalid Al-Harbi (Direct manager)* and approve it; then to
   *Faisal Al-Shehri (Procurement)* to review it.

## What is deliberately not real yet

Everything in the four documents is built; what stands in for real infrastructure is:

- **Database** — the JSON store in `.data/store.json` (MySQL + Drizzle replace `db/index.ts`).
- **Sign-in** — the navbar's user menu (Clerk replaces `lib/server/auth.ts`).
- **E-mail** — RFQs, POs and payment notices are recorded as sent, not sent.
- **Files** — an uploaded document keeps its file name only.
- **The attendance app** — daily workers' attendance is recorded in the admin, where the
  app's records would land.
- **The ledger** — derived on read from the documents, not posted; a real accounting
  system would post journal entries.

## Roadmap after the MVP

- The real infrastructure above.
- Arabic (RTL) — the UI already uses logical CSS properties only.
- A customer/subcontractor portal in `apps/client`, if wanted.
