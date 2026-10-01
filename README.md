# Projects ERP — MVP

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
- **No auth provider.** The top bar's user switcher picks the acting staff member (one
  per role). Approval chains check that role, so walking a request through its chain
  means switching user. `apps/admin/src/lib/server/auth.ts` is where Clerk will go.
- **No file storage.** Uploading a document records its file name.

## Modules

| Area | Screens | Spec |
| --- | --- | --- |
| Projects | Mobily's 13 stages, STC's stages, permits, lab tests, documents and approvals, certificates and invoices | `docs/mobily-workflow.md`, `docs/stc-workflow.md` |
| Procurement | Purchase requests, RFQs and comparison, quotation and PO approval, POs, receiving, suppliers | `docs/procurement-warehouse-custody.md` §1–2 |
| Warehouse | Stock and item cards, issue requests, asset custody, transfers, stocktakes, write-offs | §2–5 |
| Custody | Cash custody, employee statements and clearance | §4 |
| Finance | Supplier invoices, due schedule and ageing, subcontractors and extracts, customer invoices, budgets, monthly closing, VAT | `docs/finance.md` |
| Overview | Dashboard, my approvals, alerts, activity log | all |

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

## Roadmap after the MVP

- MySQL + Drizzle behind `db/index.ts`; Clerk behind `lib/server/auth.ts`; R2 for files.
- Payroll and the fixed-asset register (finance §6–7), social insurance, the full report
  catalogue with PDF/Excel export.
- E-mail delivery for RFQs, POs and payment notices (recorded today, not sent).
- Arabic (RTL) — the UI already uses logical CSS properties only.
- A customer/subcontractor portal in `apps/client`, if wanted.
