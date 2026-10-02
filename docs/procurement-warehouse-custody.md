# Procurement, warehouse and custody

Source: *Workflow (مشتريات – عهده – مخازن)*.

## 1. Purchasing cycle

1. **Purchase request (PR)** from the department when an item reaches its reorder level:
   item, quantity, expected supply date. On approval it must fit the project **budget** and
   is reserved against it automatically.
2. Direct manager approves.
3. **Procurement review**: checks whether the stock is actually available in the warehouse
   and the system. If it is, the request goes to the region project manager, the company
   projects manager and procurement for approval, and is supplied from stock.
4. **RFQ** to at least **three suppliers**, or attach a previously approved quotation
   (quantities may be adjusted). Requested by email.
5. **Compare quotations**: price, quality, delivery time, payment terms.
6. **Quotation approval**: region PM → procurement → projects manager → CFO → COO → deputy GM.
7. **Purchase order** with company and supplier details and contacts, items, quantities,
   price before and after VAT, delivery period and payment terms; sent to the supplier by email.
8. **PO approval**: the same six approvers.
9. **Delivery follow-up**: delivery date tracked, delays recorded.
10. **Receiving** at the warehouse (section 2).
11. **Matching**: PO + agreed quotation + receipt.
12. Invoice approval and transfer to accounts for payment.
13. **Supplier evaluation**: quality, punctuality, price.

Other cases: amending or cancelling a PO (procurement + the approver, change log kept);
late supplier (automatic alert); non-conforming delivery (return to supplier);
annual contracts; advance payments linked to the PO and settled on the final invoice.

How the system handles them:

- **Modifying a PO** — procurement changes quantities, prices or delivery while the PO
  is not fully received (never below what was accepted); an increase is checked against
  the budget, and the PO goes back through the full PO approval chain. The change and
  its reason go into the PO's change log.
- **Late supplier** — the alert, plus the contract's penalty: a % of the invoiced value
  per day the last receipt on an invoice came after the expected delivery, capped. It is
  deducted automatically when the invoice is registered. Terms come from the annual
  contract, or procurement sets them on the PO before it is sent.
- **Non-conforming supply** — rejected quantities at receipt become a return note and
  stay outstanding on the PO until re-delivered. Goods found faulty in stock are returned
  from stock against a **debit note** (set off automatically against the supplier's next
  invoice) or a **replacement** (booked back into stock when it arrives).
- **Annual contracts** — agreed prices per item for a period, with delivery, payment and
  penalty terms. A request in RFQ whose items a contract in force prices can be ordered
  under it: the PO is raised at the contract's prices without quotations and goes to the
  PO approval chain. An alert shows 30 days before a contract ends.

## 2. Receiving

Approved PO → goods arrive → receipt report (quantity and specification against the PO)
→ quality check: accept, reject, or partial with the reason → **addition note**, stock
balance updated automatically.

## 3. Issuing

1. The project manager submits an issue request naming the recipient, and whether the item
   is a **consumable** or a **fixed asset** (recorded as custody on the employee until
   returned, with periodic custody counts — weekly, monthly, quarterly, semi-annual or annual).
2. Region project manager approves.
3. Issue note signed by the recipient, the storekeeper and the region project manager.
4. Quantity deducted automatically and charged to the department, cost center or subcontractor.

Special cases: damage, loss or theft — investigation, then a charge or write-off decision.

## 4. Cash custody

1. Request in the employee's name, approved by the region accountant, region PM, projects
   manager, CFO, COO and deputy GM.
2. Disbursement is recorded automatically in the employee's custody ledger.
3. Signed receipt form: amount, serial number, city, date, work order number, project,
   detail per line. **No further custody for that project until the old one is settled.**
4. **Clearance** when the employee leaves or moves branch is approved only after every
   custody is settled.

## 5. Other warehouse operations

- **Transfer** between warehouses approved by the storekeeper, region accountant, region PM,
  projects manager and COO; the balance moves automatically on approval.
- **Stocktake**: code, item, category, date, warehouse, actual quantity; actual vs book;
  differences settled with management approval.
- **Write-off**: approved by the storekeeper, region PM, projects manager, CFO, COO and deputy GM.

## 6–7. Reports and general requirements

Stock balance and item card, items under reorder level, custody per employee, receipts and
issues, stocktake differences, overdue custody, open and late POs, supplier price
comparison, supplier performance, approved purchases by department. Audit log on every
operation, notifications on pending requests, automatic document numbering, printable forms.

## Assumptions

- "Management approval" for stocktake differences is the **COO**.
- The cash-custody rule "no further custody on the project until the old one is settled" is
  applied per employee and project.
