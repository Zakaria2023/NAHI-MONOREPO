# STC workflow

Source: *Project Workflow – مشاريع STC*. Controls the move between STC's stages and
tracks every document's approvals.

## Stages

| Stage                  | Precondition                                  | Requirements                                                            | Approvals                        | Output                             |
| ---------------------- | --------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------- | ---------------------------------- |
| Design                 | Design closed in ISOW                         | End Date appears (STC approves the design), then wait 24 hours          | —                                | Move to M2                         |
| M2 Permit              | 24 h passed since the design End Date         | Permit Application, Permit Receipt, Baladiyah documents                 | Docs 1 and 2 mandatory; Baladiyah can come later | M2 End Date → Supervisor → Inspector |
| M3 Implementation/RFS  | Supervisor has assigned the Inspector          | PAT (ordered steps), Milestones, Traces, Power Picture, 5 RFS docs, As-Built | Inspector + Supervisor        | M3 End Date and Milestone closed   |
| M4                     | PAT fully complete + M3 closed                 | M4 document + HO screenshot from PM                                    | (blank in source)                | Move to M5                         |
| M5                     | M4 approved                                    | —                                                                       | STC QC + PM                      | Site appears on the Dashboard      |

PAT steps, in order: upload GT on NE after SDQC approval → request upload on NPTS →
prepare Plate Marking per GT → STC sets the PAT schedule → PAT completed.

RFS documents: Budget Calculator, ODF to TB Power Meter, OTDR Splice Average, Material
Form, FTR.

## System rules (section 5) — where each is enforced

All in `packages/services/src/rules/stc.ts`.

1. No move from Design to M2 before 24 hours have passed since the End Date (the UI shows a countdown).
2. The M2 End Date is generated only when Permit Application and Permit Receipt are approved.
3. Baladiyah is not a condition for the End Date, but stays visible as a pending approval.
4. Implementation does not start until the Supervisor has assigned the Inspector.
5. A Milestone closes only with both the Inspector's and the Supervisor's approval.
6. A Milestone is rejected automatically when quantity increased or a new UPL was added without a C09.
7. M4 does not open until PAT is complete for the whole site and M3 is closed.
8. The site appears on the Dashboard only after every stage is approved.

Extra requests (section 6): each document linked to the party responsible for it;
Pending / Approved / Rejected status per document with an approvals board; a warning
before approving a Milestone with increased quantity or a new UPL and no C09; the 24-hour
countdown; an activity log of dates, approvals and who made them.

## Assumptions where the source is blank

- The responsible party for the three M2 documents is blank; it is recorded as **STC**
  (the permit owner) until named.
- The M4 approver is blank; it is recorded as **Supervisor**, the party already approving
  M3 for the same site.
- The M5 approval is modelled as an "M5 acceptance" document approved by STC QC and the PM.
