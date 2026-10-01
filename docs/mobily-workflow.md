# Mobily workflow

Source: *Mobily Workflow – دورة عمل مشاريع موبايلي*. Covers a Mobily project from the
design department's request to PO closure.

## Stages

| #  | Stage            | Steps tracked in the system                                                     | Output              |
| -- | ---------------- | ------------------------------------------------------------------------------- | ------------------- |
| 1  | Design request   | Site survey, design package submitted                                           | Design package      |
| 2  | PO issue         | PR requested (Mobily internal), PO received by the contractor                    | PO                  |
| 3  | Mobilization     | Material delivered **in full, in one batch**, equipment & safety tools, manpower | Ready to execute    |
| 4  | Permits          | One record per permit: MOT, Municipality, Traffic, AMN, service authorities      | Permits             |
| 5  | Implementation   | Trench excavation, pipe laying, MH installation, concrete backfilling (+samples), milling & paving, cable pulling & splicing; lab tests (Municipal, Mobily) | Works complete |
| 6  | PAT request      | PAT documents submitted                                                          | PAT                 |
| 7  | Site HO          | Mandrel test, FOC end-to-end test, OTDR test, Oil Sheet signed                   | Signed Oil Sheet    |
| 8  | Permit HO        | Stage 1 Certificate of Completion of Work, Stage 2 Party Clearance, Stage 3 Final Clearance (two years later) | Final clearance |
| 9  | Remedy approval  | Remedy requested, remedy approval received                                      | Remedy approval     |
| 10 | PCR & SDN        | PCR requested, SDN approved, as-built quantities submitted                       | Quantities approved |
| 11 | Certificates     | RFS → PAC → FAC, each submitted on the NAS system and received                   | Certificates        |
| 12 | Invoices         | One invoice per certificate on I-Supplier, paid 60 days after submission         | Payment             |
| 13 | PO closure       | PO closure submitted, PO closed                                                  | PO closed           |

## System rules (section 6) — where each is enforced

All in `packages/services/src/rules/mobily.ts` unless noted.

1. Mobilization is linked to an issued PO; materials are recorded as delivered in full, in one batch.
2. Each permit stores its expected duration; the expected expiry date is computed automatically.
3. Each lab test (Municipal Laboratory, Mobily Laboratory) and the concrete samples show their status in Implementation.
4. Remedy Approval cannot be requested before the Oil Sheet is signed.
5. A PAC request cannot be opened before the RFS certificate is received.
6. A FAC request cannot be opened before RFS and PAC are received **and** one year has passed since the PAC date (computed automatically).
7. An invoice for RFS / PAC / FAC is created only after the matching certificate is received.
8. The payment due date is 60 days after the invoice is submitted on I-Supplier.
9. Permit HO Stage 3 (Final Clearance Certificate) is tracked two years after Stage 2.
10. PO closure cannot be submitted before RFS, PAC and FAC are all received.

Extra requests (section 7): alerts before permit expiry, FAC eligibility and final
clearance (`packages/services/src/alerts.ts`); a per-PO dashboard with the current
stage and the missing items (project detail page); every certificate linked to its
invoice and expected payment date; an activity log of dates, documents and approvals.

## Assumptions where the source is blank

- Stage 1 / Stage 2 durations of Permit HO are blank (`.....`) in the source. They are
  stored as plain dates with no expected duration until the business supplies one.
- "Final clearance after two years" is counted from the Stage 2 (Party Clearance) date.
- The second laboratory in rule 3 is blank; the system uses the two labs named in
  section 3: Municipal Laboratory and Mobily Laboratory.
- Natural prerequisites the source implies by order but does not number: implementation
  needs mobilization complete and at least one issued permit; PAT needs the works and all
  lab tests passed; certificates need PCR/SDN done.
