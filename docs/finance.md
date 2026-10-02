# Finance

Source: *Workflow – الحسابات والمقاولين والعملاء والموازنات*.

## 1. Accounts payable (suppliers)

Mandatory fields on a supplier invoice: supplier **VAT number**, supplier details (trade
name, address, CR as on the invoice), **invoice number** (unique per supplier), **VAT
amount** (computed or entered, and consistent with net and total).

Input controls: no new supplier with the same name or VAT number as an existing one; no
invoice number twice for the same supplier; an invoice missing the VAT number or company
details is refused.

Cycle: receive the invoice and link it to the PO and the matching receipt → register it →
**three-way match** (PO + receipt + invoice) → approve → **deduct the advance payment** linked
to the PO automatically → add to the **weekly due schedule** by due date → record payment
(bank transfer / cheque) against the invoices paid → **payment notice e-mailed** to the
supplier → supplier statement reconciliation.

Reports: supplier ageing, weekly due schedule, supplier statement, pending invoices,
payment notices sent.

## 2. Subcontractors

1. Subcontractor submits an **extract** of executed quantities; the project engineer reviews and approves.
2. Projects manager approves, then finance.
3. Deduct the advance payment due.
4. Deduct the contract **retention** percentage.
5. Deduct **penalties** (delay or breach) if any.
6. Deduct the value of **materials issued** to the subcontractor from the warehouse, automatically.
7. Approve the net due and post it for payment.

Reports: subcontractor statement, retention held, materials issued and deducted.

## 3. Customers (revenue and collection)

As-built extract from site → compared with the quantities recorded in the system →
approved → **tax invoice** issued → collection tracked, alert when the due date passes.

## 4. Project budget

Approved before execution; matched automatically against custody, POs, issues and any other
expense on the project to show consumed and remaining. Study lines: civil works, fiber
works, equipment, fiber materials, civil materials, manpower, permits, overhead.
Controls: limited rights to change an approved budget, with a log of each change and its
reason. Reports: budget vs actual, open commitments, profitability, cost to date, overruns.

## 5. Monthly closing

A period closes only after an approved checklist: procurement and warehouse closed (no
pending documents), bank reconciliation, supplier balances, customer balances, custody
closed (no open custody), payroll, depreciation, accruals/prepayments/suspense, lock the
period, issue the financial statements.

## 6. Payroll

- **Employees** — monthly staff (basic, housing, transport) and daily workers (a daily
  rate), each with an IBAN and a default project.
- **Timesheets** — per employee per month: days per project, absences, overtime hours.
  **Attendance** for daily workers is what the attendance app records (one entry per day
  on a site); entered in the admin when the app is not used. Both close once the month's
  payroll is approved.
- **Payroll run** — calculates every active employee's payslip and fixes it; a draft is
  recalculated after a timesheet changes. The finance manager approves; the accountant
  marks it paid with the bank transfer reference.
- **Reports** — payroll register, each employee's payslip (printable), the bank transfer
  file (Excel), social insurance per employee, labour cost per project.
- Labour cost is split over projects by timesheet days and counts against each project's
  **manpower** budget once the run is approved.

## 7. Fixed assets

- **Asset card** — number, category, serial, purchase date, cost, salvage value, useful
  life, where it is (a warehouse) or who holds it (an employee), and the project its
  depreciation is charged to.
- **Depreciation** — straight-line, worked out by the system from the month of purchase;
  the last month takes the rounding so the asset ends at its salvage value. Each month's
  depreciation is **posted once**; the closing checklist will not tick depreciation until
  it is.
- **Transfer** between warehouses or employees updates the card and its history.
- **Annual count** — once a year per asset: found or missing, and its condition.
- **Sale or scrap** takes the asset off the books with the gain or loss against its book
  value at that date; nothing is charged after it.
- **Reports** — asset register, depreciation per month, the depreciation schedule of each
  asset, the annual count's progress.

## 4 (continued) — the study, cost centres, overhead

- **Budget study** — per project, the detailed lines behind each category: civil and
  fiber works (quantity × rate), materials, equipment (how it is supplied — daily or
  monthly rent, or a company asset — for how long, civil or fiber work), manpower by job
  title (headcount × months × monthly cost), permits, overhead. Amount = qty × unit cost ×
  duration. **Applying the study** writes its category totals as the budget's planned
  lines; on an approved budget that is a revision (projects or finance manager, reason
  kept).
- **Timelines** — when materials, manpower and equipment are needed, drawn as bars.
- **Variance analysis** — for each category: the study, the budget, actual cost
  (supplier invoices, custody, extracts, stock, payroll, expenses, overhead), the
  variance and what is still committed on POs.
- **Cost centres and manual expenses** — every project is a cost centre; departments and
  vehicles are added. A manual expense is refused without a cost centre, a vehicle
  expense unless it is split over exactly two, and the shares must add up to the amount.
  A share charged to a project counts against that project's budget line.
- **Overhead allocation** — each month's pool (expenses charged to departments and
  vehicles, the head-office payroll, the depreciation of head-office assets) is spread
  over the projects whose budget is approved, by revenue invoiced to date, direct cost to
  date, or in equal shares; posted once a month, each share counts against the project's
  overhead budget.

## 5 (rules added) — the closing checklist

Payroll can be ticked only when the month's payroll is paid; depreciation only when the
month's depreciation is posted.

## 8–9. Taxes, reports

The VAT summary (input VAT from supplier invoices, output VAT from customer invoices).

## Assumptions

- VAT is 15 %. The VAT on an invoice must be within SAR 0.05 of 15 % of the net, and net +
  VAT must equal the total.
- Supplier payment terms are expressed in days on the PO; the due date is the invoice date
  plus those days.
- A subcontract's advance is recovered in proportion to each extract's gross value, capped
  at what is left to recover.
- Payroll: a month is 30 days; absence is deducted at (basic + housing + transport) ÷ 30
  a day; overtime is 1.5 × the hourly rate (basic ÷ 30 ÷ 8, or the daily rate ÷ 8).
- GOSI on basic + housing, capped at SAR 45,000: Saudi 9.75 % employee + 11.75 % company;
  non-Saudi 2 % company only (occupational hazards). Daily workers follow the same rates
  on their earned basic.
- The payroll approval chain is the finance manager alone (the documents name none).
