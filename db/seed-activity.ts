import { generateUuid } from "utils";
import { EntityKind, MobilyStep } from "./enum";
import {
  CLOSING_ITEM_LABELS,
  MOBILY_STEP_LABELS,
  PERMIT_AUTHORITY_LABELS,
  STAFF_ROLE_LABELS,
  STC_DOCUMENT_LABELS,
  STC_PARTY_LABELS,
  STC_PAT_STEP_LABELS,
  STC_STAGE_LABELS,
} from "./label";
import { ActivityEntry, Approval, Store } from "./types";

// THE DEMO'S ACTIVITY LOG, built from the seeded records themselves: every
// dated step, approval, receipt, payment and closing tick becomes the entry the
// live system would have written when it happened. So every record's log has
// its history, and the global log reads as months of use.

type Draft = Omit<ActivityEntry, "uuid">;

export const deriveActivity = (store: Store): ActivityEntry[] => {
  const entries: Draft[] = [];
  const add = (entity: EntityKind, entityUuid: string, entityLabel: string, at: string, actorName: string, action: string, detail?: string) =>
    entries.push({ entity, entityUuid, entityLabel, at, actorName, action, detail });
  const chain = (entity: EntityKind, uuid: string, label: string, approvals: Approval[], what = "") =>
    approvals.forEach((a) =>
      add(entity, uuid, label, a.at, a.actorName, `${what}${a.decision === "approved" ? "Approved" : "Rejected"} by ${STAFF_ROLE_LABELS[a.role].toLowerCase()}`, a.note),
    );

  for (const p of store.Projects) {
    add("project", p.uuid, p.code, p.createdAt, p.projectManagerName, "Project created", p.name);
    if (p.mobily) {
      for (const [step, record] of Object.entries(p.mobily.steps)) {
        if (record) {
          add("project", p.uuid, p.code, record.at, record.by, MOBILY_STEP_LABELS[step as MobilyStep], record.note);
        }
      }
      for (const permit of p.mobily.permits) {
        const label = `${PERMIT_AUTHORITY_LABELS[permit.authority]} ${permit.reference}`;
        add("project", p.uuid, p.code, permit.requestedAt, p.projectManagerName, "Permit requested", `${label} — ${permit.durationDays} days`);
        if (permit.issuedAt) {
          add("project", p.uuid, p.code, permit.issuedAt, p.projectManagerName, "Permit issued", label);
        }
      }
    }
    if (p.stc) {
      const wf = p.stc;
      if (wf.designEndDate) {
        add("project", p.uuid, p.code, wf.designEndDate, p.projectManagerName, "Design closed in ISOW, End Date recorded");
      }
      for (const h of wf.stageHistory) {
        add("project", p.uuid, p.code, h.at, h.by, `Moved to ${STC_STAGE_LABELS[h.stage]}`);
      }
      for (const d of wf.documents) {
        if (d.uploadedAt) {
          add("project", p.uuid, p.code, d.uploadedAt, p.projectManagerName, `${STC_DOCUMENT_LABELS[d.key]} uploaded`, d.fileName);
        }
        for (const a of d.approvals) {
          add("project", p.uuid, p.code, a.at, a.by, `${STC_DOCUMENT_LABELS[d.key]} ${a.decision} by ${STC_PARTY_LABELS[a.party]}`, a.note);
        }
      }
      for (const [step, record] of Object.entries(wf.patSteps)) {
        if (record) {
          add("project", p.uuid, p.code, record.at, record.by, STC_PAT_STEP_LABELS[step as keyof typeof STC_PAT_STEP_LABELS]);
        }
      }
      if (wf.inspectorAssignedAt && wf.inspectorName) {
        add("project", p.uuid, p.code, wf.inspectorAssignedAt, p.projectManagerName, "Inspector assigned by Supervisor", wf.inspectorName);
      }
      if (wf.milestone.closedAt) {
        add("project", p.uuid, p.code, wf.milestone.closedAt, p.projectManagerName, "Milestone closed in Equait");
      }
    }
  }

  for (const pr of store.PurchaseRequests) {
    add("purchase_request", pr.uuid, pr.number, pr.createdAt, pr.requestedBy, "Purchase request raised", pr.department);
    chain("purchase_request", pr.uuid, pr.number, pr.approvals);
    chain("purchase_request", pr.uuid, pr.number, pr.quoteApprovals, "Quotation: ");
  }
  for (const q of store.Quotations) {
    const pr = store.PurchaseRequests.find((r) => r.uuid === q.prUuid);
    if (pr) {
      add("purchase_request", pr.uuid, pr.number, q.receivedAt, pr.requestedBy, "Quotation recorded", q.number);
    }
  }
  for (const po of store.PurchaseOrders) {
    add("purchase_order", po.uuid, po.number, po.createdAt, "System", "Purchase order raised");
    chain("purchase_order", po.uuid, po.number, po.approvals);
    if (po.sentAt) {
      add("purchase_order", po.uuid, po.number, po.sentAt, "Procurement", "Sent to supplier by e-mail");
    }
    if (po.evaluation) {
      add("purchase_order", po.uuid, po.number, po.evaluation.at, po.evaluation.by, "Supplier evaluated", `Quality ${po.evaluation.quality}, on time ${po.evaluation.onTime}, price ${po.evaluation.price}`);
    }
  }
  for (const grn of store.GoodsReceipts) {
    add("purchase_order", grn.poUuid, store.PurchaseOrders.find((p) => p.uuid === grn.poUuid)?.number ?? "", grn.receivedAt, grn.receivedBy, `Goods received — ${grn.number}`);
  }
  for (const ir of store.IssueRequests) {
    chain("issue_request", ir.uuid, ir.number, ir.approvals);
    if (ir.issuedAt) {
      add("issue_request", ir.uuid, ir.number, ir.issuedAt, ir.signedByKeeper ?? "", "Stock issued", `Signed by ${ir.signedByRecipient ?? ""}`);
    }
  }
  for (const t of store.StockTransfers) {
    add("stock_transfer", t.uuid, t.number, t.createdAt, t.requestedBy, "Transfer requested");
    chain("stock_transfer", t.uuid, t.number, t.approvals);
  }
  for (const s of store.Stocktakes) {
    add("stocktake", s.uuid, s.number, s.countedAt, s.countedBy, "Stocktake recorded");
    chain("stocktake", s.uuid, s.number, s.approvals);
  }
  for (const w of store.WriteOffs) {
    add("write_off", w.uuid, w.number, w.createdAt, w.requestedBy, "Write-off raised", w.investigation);
    chain("write_off", w.uuid, w.number, w.approvals);
  }
  for (const c of store.CashCustodies) {
    add("cash_custody", c.uuid, c.number, c.createdAt, c.employeeName, "Custody requested", c.employeeName);
    chain("cash_custody", c.uuid, c.number, c.approvals);
    if (c.disbursedAt) {
      add("cash_custody", c.uuid, c.number, c.disbursedAt, "Finance", "Disbursed — receipt form signed by the employee");
    }
    if (c.settlement) {
      add("cash_custody", c.uuid, c.number, c.settlement.settledAt, c.settlement.by, "Settled", `Spent ${c.settlement.spent}, returned ${c.settlement.returned}`);
    }
  }
  for (const inv of store.SupplierInvoices) {
    add("supplier_invoice", inv.uuid, inv.number, inv.createdAt, inv.registeredBy, "Invoice registered and matched", inv.invoiceNumber);
    if (inv.approvedBy) {
      add("supplier_invoice", inv.uuid, inv.number, inv.createdAt, inv.approvedBy, "Approved — added to the due schedule");
    }
    for (const pay of inv.payments) {
      add("supplier_invoice", inv.uuid, inv.number, pay.at, pay.by, "Paid by bank transfer — notice e-mailed", pay.reference);
    }
  }
  for (const ex of store.Extracts) {
    add("extract", ex.uuid, ex.number, ex.createdAt, ex.submittedBy, "Extract submitted");
    chain("extract", ex.uuid, ex.number, ex.approvals);
    if (ex.paidAt) {
      add("extract", ex.uuid, ex.number, ex.paidAt, "Finance", "Paid");
    }
  }
  for (const ci of store.CustomerInvoices) {
    add("customer_invoice", ci.uuid, ci.number, ci.submittedAt, ci.createdBy, "Invoice issued");
    if (ci.paidAt) {
      add("customer_invoice", ci.uuid, ci.number, ci.paidAt, ci.createdBy, "Payment collected");
    }
  }
  for (const b of store.ProjectBudgets) {
    const code = store.Projects.find((p) => p.uuid === b.projectUuid)?.code ?? "";
    if (b.approvedAt && b.approvedBy) {
      add("budget", b.projectUuid, code, b.approvedAt, b.approvedBy, "Budget approved");
    }
    for (const r of b.revisions) {
      add("budget", b.projectUuid, code, r.at, r.by, "Approved budget revised", r.reason);
    }
  }
  for (const c of store.SupplierContracts) {
    add("supplier_contract", c.uuid, c.number, c.createdAt, c.createdBy, "Annual contract signed", c.title);
  }
  for (const r of store.SupplierReturns) {
    add(
      "supplier_return",
      r.uuid,
      r.number,
      r.createdAt,
      r.createdBy,
      r.debitNoteNumber ? "Returned to supplier — debit note" : "Returned to supplier — replacement",
      r.debitNoteNumber ? `${r.debitNoteNumber} — ${r.reason}` : r.reason,
    );
  }

  for (const run of store.PayrollRuns) {
    add("payroll_run", run.uuid, run.number, run.createdAt, run.createdBy, "Payroll calculated", `${run.payslips.length} employees`);
    chain("payroll_run", run.uuid, run.number, run.approvals);
    if (run.paidAt && run.paidBy) {
      add("payroll_run", run.uuid, run.number, run.paidAt, run.paidBy, "Salaries paid by bank transfer", run.bankReference);
    }
  }

  for (const a of store.FixedAssets) {
    add("fixed_asset", a.uuid, a.number, a.createdAt, a.createdBy, "Asset registered", `${a.name} — ${a.serialNumber}`);
    for (const t of a.transfers) {
      add("fixed_asset", a.uuid, a.number, t.at, t.by, "Asset transferred", t.note);
    }
    for (const c of a.counts) {
      add("fixed_asset", a.uuid, a.number, c.at, c.by, c.found ? "Counted — found" : "Counted — missing", c.condition);
    }
    if (a.disposal) {
      add("fixed_asset", a.uuid, a.number, a.disposal.at, a.disposal.by, a.disposal.kind === "sale" ? "Sold — off the books" : "Scrapped — off the books", a.disposal.note);
    }
  }
  for (const d of store.DepreciationRuns) {
    add("depreciation", d.uuid, d.period, d.postedAt, d.postedBy, "Depreciation posted", `${d.lines.length} assets`);
  }

  for (const e of store.Expenses) {
    add("expense", e.uuid, e.number, e.createdAt, e.createdBy, "Expense recorded", e.description);
  }
  for (const o of store.OverheadAllocations) {
    add("overhead_allocation", o.uuid, o.period, o.postedAt, o.postedBy, "Overhead allocated", `${o.lines.length} projects`);
  }

  for (const c of store.Cheques) {
    if (c.clearedAt) {
      add("cheque", c.uuid, c.number, c.clearedAt, "Bank", "Cheque cleared", c.party);
    }
    if (c.bouncedAt) {
      add("cheque", c.uuid, c.number, c.bouncedAt, "Bank", "Cheque bounced", `${c.ref.label} reopened — ${c.bounceReason ?? ""}`);
    }
  }
  for (const r of store.BankReconciliations) {
    const account = store.BankAccounts.find((a) => a.uuid === r.bankAccountUuid);
    add("bank_account", r.bankAccountUuid, account?.code ?? "", r.at, r.by, "Bank reconciled", r.period);
  }
  for (const g of store.LettersOfGuarantee) {
    add("guarantee", g.uuid, g.number, g.issuedAt, "Huda Al-Zahrani", "Letter of guarantee recorded", g.beneficiary);
  }
  for (const f of store.TaxFilings) {
    add("tax_filing", f.uuid, `${f.kind.toUpperCase()} ${f.period}`, f.filedAt, f.by, f.kind === "vat" ? "VAT return filed" : "Social insurance paid", f.reference);
  }

  for (const period of store.ClosingPeriods) {
    for (const [key, record] of Object.entries(period.items)) {
      if (record) {
        add("closing", period.uuid, period.period, record.at, record.by, "Checklist item done", CLOSING_ITEM_LABELS[key as keyof typeof CLOSING_ITEM_LABELS]);
      }
    }
    if (period.closedAt && period.closedBy) {
      add("closing", period.uuid, period.period, period.closedAt, period.closedBy, "Period closed");
    }
  }

  const staffName = (uuid: string) => store.StaffUsers.find((u) => u.uuid === uuid)?.name ?? "Former staff";
  for (const t of store.Tasks) {
    const assignee = staffName(t.assigneeUuid);
    add("task", t.uuid, t.number, t.createdAt, staffName(t.assignedByUuid), `Task given to ${assignee}`, t.title);
    if (t.seenAt && t.assigneeUuid !== t.assignedByUuid) {
      add("task", t.uuid, t.number, t.seenAt, assignee, "Seen by the assignee");
    }
    if (t.startedAt) {
      add("task", t.uuid, t.number, t.startedAt, assignee, "Work started");
    }
    for (const log of t.workLogs) {
      add("task", t.uuid, t.number, log.at, log.by, `Logged ${log.hours} hour(s)`, log.note);
    }
    for (const comment of t.comments) {
      add("task", t.uuid, t.number, comment.at, comment.by, "Comment added", comment.text);
    }
    if (t.status === "on_hold" && t.reason) {
      add("task", t.uuid, t.number, t.workLogs.at(-1)?.at ?? t.startedAt ?? t.createdAt, assignee, "Put on hold", t.reason);
    }
    if (t.submittedAt) {
      add("task", t.uuid, t.number, t.submittedAt, assignee, "Handed in as finished");
    }
    if (t.completedAt) {
      add("task", t.uuid, t.number, t.completedAt, staffName(t.assignedByUuid), "Accepted as done");
    }
    if (t.cancelledAt) {
      add("task", t.uuid, t.number, t.cancelledAt, staffName(t.assignedByUuid), "Task cancelled", t.reason);
    }
  }

  return entries
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((entry) => ({ uuid: generateUuid(), ...entry }));
};
