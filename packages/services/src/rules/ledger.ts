import { nowIso, round2 } from "utils";
import { BankAccount, Store } from "../../../../db/types";
import { chargeFor } from "./assets";
import { advancePaidAt, primaryAccountOf, vatNetFor } from "./banking";

// THE GENERAL LEDGER, derived. The MVP keeps documents, not journal entries:
// every invoice, payment, receipt, issue, extract, payroll, expense, custody,
// asset and filing implies a balanced double entry, and this file writes it out
// on read. So the ledger can never disagree with the documents, the trial
// balance always balances, and the bank lines equal the bank accounts' own
// movements (a test holds both).
//
// A movement dated before its bank account was opened is part of the opening
// position, so it goes to equity rather than the bank — the same rule the bank
// balance follows.

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export type LedgerAccount = {
  code: string;
  name: string;
  type: AccountType;
};

export type JournalLine = {
  account: string;
  debit: number;
  credit: number;
  /** The project a cost or revenue belongs to — the cost-centre view. */
  projectUuid?: string;
};

export type JournalEntry = {
  key: string;
  at: string;
  reference: string;
  description: string;
  lines: JournalLine[];
};

export const CHART: LedgerAccount[] = [
  { code: "1100", name: "Accounts receivable — customers", type: "asset" },
  { code: "1200", name: "Inventory", type: "asset" },
  { code: "1210", name: "Supplier claims for returned goods", type: "asset" },
  { code: "1250", name: "Employee custody and receivables", type: "asset" },
  { code: "1300", name: "Input VAT", type: "asset" },
  { code: "1305", name: "VAT refundable", type: "asset" },
  { code: "1310", name: "Advances to suppliers", type: "asset" },
  { code: "1320", name: "Advances to subcontractors", type: "asset" },
  { code: "1500", name: "Fixed assets — cost", type: "asset" },
  { code: "1510", name: "Accumulated depreciation", type: "asset" },
  { code: "2000", name: "Accounts payable — suppliers", type: "liability" },
  { code: "2010", name: "Goods received, not invoiced", type: "liability" },
  { code: "2050", name: "Subcontractors payable", type: "liability" },
  { code: "2060", name: "Retentions held — subcontractors", type: "liability" },
  { code: "2100", name: "Output VAT", type: "liability" },
  { code: "2200", name: "Salaries payable", type: "liability" },
  { code: "2210", name: "Social insurance payable", type: "liability" },
  { code: "3000", name: "Owners' equity and opening balances", type: "equity" },
  { code: "4000", name: "Contract revenue", type: "revenue" },
  { code: "4100", name: "Other income", type: "revenue" },
  { code: "5000", name: "Project cost — materials", type: "expense" },
  { code: "5100", name: "Project cost — subcontractors", type: "expense" },
  { code: "5200", name: "Project cost — labour", type: "expense" },
  { code: "5300", name: "Project cost — site expenses", type: "expense" },
  { code: "6000", name: "Operating expenses", type: "expense" },
  { code: "6100", name: "Depreciation", type: "expense" },
  { code: "6200", name: "Losses and write-offs", type: "expense" },
];

export const bankAccountCode = (account: Pick<BankAccount, "code">): string => `1010-${account.code}`;

/** The chart with one bank account line per bank account. */
export const chartOf = (store: Store): LedgerAccount[] => [
  ...store.BankAccounts.map((a) => ({ code: bankAccountCode(a), name: `Bank — ${a.code} (${a.bank})`, type: "asset" as const })),
  ...CHART,
].sort((a, b) => a.code.localeCompare(b.code));

/** Every month from `first` to `last` inclusive, as "2026-09" keys. */
const monthsBetween = (first: string, last: string): string[] => {
  const months: string[] = [];
  let [year, month] = first.split("-").map(Number);
  for (let key = first; key <= last; key = `${year}-${String(month).padStart(2, "0")}`) {
    months.push(key);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
};

const dr = (account: string, amount: number, projectUuid?: string): JournalLine => ({ account, debit: round2(amount), credit: 0, projectUuid });
const cr = (account: string, amount: number, projectUuid?: string): JournalLine => ({ account, debit: 0, credit: round2(amount), projectUuid });

export const journal = (store: Store, asOf: string = nowIso()): JournalEntry[] => {
  const entries: JournalEntry[] = [];
  const add = (key: string, at: string, reference: string, description: string, lines: JournalLine[]) => {
    const kept = lines.filter((l) => l.debit !== 0 || l.credit !== 0);
    if (at <= asOf && kept.length > 0) {
      entries.push({ key, at, reference, description, lines: kept });
    }
  };
  const primary = store.BankAccounts.length > 0 ? primaryAccountOf(store) : null;
  /** The bank side of a movement — or equity, when it predates the account. */
  const bank = (accountUuid: string | undefined, at: string): string => {
    const account = store.BankAccounts.find((a) => a.uuid === accountUuid) ?? primary;
    return account && at >= account.openingDate ? bankAccountCode(account) : "3000";
  };
  const poOf = (uuid: string) => store.PurchaseOrders.find((p) => p.uuid === uuid);

  for (const a of store.BankAccounts) {
    add(`open-${a.uuid}`, a.openingDate, a.code, "Opening balance", [dr(bankAccountCode(a), a.openingBalance), cr("3000", a.openingBalance)]);
  }

  // ─── Stock ───
  for (const m of store.StockMovements) {
    const value = round2(Math.abs(m.qty) * m.unitCost);
    const project = m.projectUuid;
    if (m.type === "receipt" && m.refKind === "goods_receipt") {
      add(`m-${m.uuid}`, m.at, m.refNumber, "Goods received", [dr("1200", value), cr("2010", value)]);
    } else if (m.type === "receipt" && m.refKind === "supplier_return") {
      add(`m-${m.uuid}`, m.at, m.refNumber, "Replacement received", [dr("1200", value), cr("1210", value)]);
    } else if (m.type === "receipt") {
      add(`m-${m.uuid}`, m.at, m.refNumber, "Opening stock", [dr("1200", value), cr("3000", value)]);
    } else if (m.type === "issue") {
      add(`m-${m.uuid}`, m.at, m.refNumber, "Materials issued to the project", [dr("5000", value, project), cr("1200", value)]);
    } else if (m.type === "return" && m.refKind === "asset_custody") {
      add(`m-${m.uuid}`, m.at, m.refNumber, "Returned from custody", [dr("1200", value), cr("5000", value, project)]);
    } else if (m.type === "write_off") {
      const writeOff = store.WriteOffs.find((w) => w.uuid === m.refUuid);
      const account = writeOff?.decision === "charge_employee" ? "1250" : "6200";
      add(`m-${m.uuid}`, m.at, m.refNumber, "Written off", [dr(account, value), cr("1200", value)]);
    } else if (m.type === "adjustment") {
      add(
        `m-${m.uuid}`,
        m.at,
        m.refNumber,
        "Stocktake difference",
        m.qty > 0 ? [dr("1200", value), cr("4100", value)] : [dr("6200", value), cr("1200", value)],
      );
    }
  }

  // ─── Suppliers ───
  for (const r of store.SupplierReturns.filter((x) => x.source === "from_stock")) {
    add(
      `rtn-${r.uuid}`,
      r.createdAt,
      r.number,
      r.debitNoteNumber ? `Debit note ${r.debitNoteNumber}` : "Returned for replacement",
      r.debitNoteNumber ? [dr("1210", r.total), cr("1200", r.subtotal), cr("1300", r.vat)] : [dr("1210", r.subtotal), cr("1200", r.subtotal)],
    );
  }
  for (const po of store.PurchaseOrders.filter((p) => p.advancePaid > 0)) {
    const at = advancePaidAt(po);
    add(`adv-${po.uuid}`, at, po.number, "Advance to supplier", [dr("1310", po.advancePaid), cr(bank(undefined, at), po.advancePaid)]);
  }
  for (const inv of store.SupplierInvoices.filter((i) => i.status !== "rejected")) {
    const project = poOf(inv.poUuid)?.projectUuid;
    add(`ap-${inv.uuid}`, inv.invoiceDate, inv.number, "Supplier invoice", [dr("2010", inv.subtotal, project), dr("1300", inv.vat), cr("2000", inv.total)]);
    add(`ap-ded-${inv.uuid}`, inv.invoiceDate, inv.number, "Advance, penalty and debit notes set off", [
      dr("2000", inv.advanceDeducted + (inv.latePenalty ?? 0) + (inv.debitNotesDeducted ?? 0)),
      cr("1310", inv.advanceDeducted),
      cr("4100", inv.latePenalty ?? 0),
      cr("1210", inv.debitNotesDeducted ?? 0),
    ]);
    for (const p of inv.payments) {
      add(`pay-${p.uuid}`, p.at, p.reference, `Payment — ${inv.number}`, [dr("2000", p.amount), cr(bank(p.bankAccountUuid, p.at), p.amount)]);
    }
  }

  // ─── Customers ───
  for (const inv of store.CustomerInvoices) {
    add(`ar-${inv.uuid}`, inv.submittedAt, inv.number, "Tax invoice", [dr("1100", inv.total), cr("4000", inv.amount, inv.projectUuid), cr("2100", inv.vat)]);
    if (inv.paidAt) {
      add(`col-${inv.uuid}`, inv.paidAt, inv.number, "Collection", [dr(bank(inv.collectedToUuid, inv.paidAt), inv.total), cr("1100", inv.total)]);
    }
  }

  // ─── Subcontractors ───
  for (const sc of store.Subcontracts.filter((s) => s.advancePaid > 0)) {
    add(`sc-adv-${sc.uuid}`, sc.createdAt, sc.number, "Advance to subcontractor", [dr("1320", sc.advancePaid), cr(bank(undefined, sc.createdAt), sc.advancePaid)]);
  }
  for (const ex of store.Extracts.filter((e) => e.status === "approved" || e.status === "paid")) {
    const project = store.Subcontracts.find((s) => s.uuid === ex.subcontractUuid)?.projectUuid;
    const at = ex.approvals.at(-1)?.at ?? ex.createdAt;
    add(`ex-${ex.uuid}`, at, ex.number, "Subcontractor extract approved", [
      dr("5100", ex.gross, project),
      cr("2050", ex.net),
      cr("2060", ex.retention),
      cr("1320", ex.advanceDeduction),
      cr("4100", ex.penalties),
      cr("5000", ex.materialsDeduction, project),
    ]);
    if (ex.paidAt) {
      add(`ex-pay-${ex.uuid}`, ex.paidAt, ex.number, "Extract paid", [dr("2050", ex.net), cr(bank(undefined, ex.paidAt), ex.net)]);
    }
  }

  // ─── Payroll and social insurance ───
  for (const run of store.PayrollRuns.filter((r) => r.status !== "draft")) {
    const at = run.approvals.at(-1)?.at ?? run.createdAt;
    const allocations = run.payslips.flatMap((p) => p.costAllocations);
    const net = round2(run.payslips.reduce((sum, p) => sum + p.net, 0));
    const gosi = round2(run.payslips.reduce((sum, p) => sum + p.gosiEmployee + p.gosiEmployer, 0));
    add(`run-${run.uuid}`, at, run.number, "Payroll", [
      ...allocations.map((a) => dr(a.projectUuid ? "5200" : "6000", a.amount, a.projectUuid)),
      cr("2200", net),
      cr("2210", gosi),
    ]);
    if (run.paidAt) {
      add(`run-pay-${run.uuid}`, run.paidAt, run.bankReference ?? run.number, "Salaries paid", [dr("2200", net), cr(bank(undefined, run.paidAt), net)]);
    }
  }
  for (const f of store.TaxFilings) {
    if (f.kind === "gosi") {
      add(`tax-${f.uuid}`, f.filedAt, f.reference, `Social insurance ${f.period}`, [dr("2210", f.amount), cr(bank(undefined, f.filedAt), f.amount)]);
    } else {
      // The filed amount is what left the bank; output VAT is closed to it.
      const { input } = vatNetFor(store, f.period);
      const net = f.amount;
      add(`tax-${f.uuid}`, f.filedAt, f.reference, `VAT return ${f.period}`, [
        dr("2100", input + net),
        cr("1300", input),
        net > 0 ? cr(bank(undefined, f.filedAt), net) : dr("1305", -net),
      ]);
    }
  }

  // ─── Expenses and custody ───
  for (const e of store.Expenses) {
    const projects = new Set(store.Projects.map((p) => p.uuid));
    add(`exp-${e.uuid}`, e.date, e.number, e.description, [
      ...e.allocations.map((a) => (projects.has(a.costCenterUuid) ? dr("5300", a.amount, a.costCenterUuid) : dr("6000", a.amount))),
      dr("1300", e.vat),
      cr(bank(undefined, e.date), e.amount + e.vat),
    ]);
  }
  for (const c of store.CashCustodies) {
    if (c.disbursedAt) {
      add(`cc-${c.uuid}`, c.disbursedAt, c.number, `Cash custody to ${c.employeeName}`, [dr("1250", c.amount), cr(bank(undefined, c.disbursedAt), c.amount)]);
    }
    if (c.settlement) {
      const { spent, returned, settledAt } = c.settlement;
      add(`cc-set-${c.uuid}`, settledAt, c.number, "Custody settled", [
        dr("5300", spent, c.projectUuid),
        dr(bank(undefined, settledAt), returned),
        cr("1250", spent + returned),
      ]);
    }
  }

  // ─── Fixed assets ───
  const lastPeriod = asOf.slice(0, 7);
  for (const a of store.FixedAssets) {
    add(`fa-${a.uuid}`, a.purchaseDate, a.number, `Asset bought — ${a.name}`, [dr("1500", a.cost), cr(bank(undefined, a.purchaseDate), a.cost)]);
    for (const period of monthsBetween(a.purchaseDate.slice(0, 7), lastPeriod)) {
      const charge = chargeFor(a, period);
      // This month's charge is dated today, so a sale this month finds it already booked.
      const at = period === lastPeriod ? asOf : `${period}-28T12:00:00.000Z`;
      add(`dep-${a.uuid}-${period}`, at, a.number, `Depreciation ${period}`, [dr("6100", charge, a.projectUuid), cr("1510", charge)]);
    }
    if (a.disposal) {
      const accumulated = round2(a.cost - a.disposal.bookValue);
      const { gainLoss, proceeds } = a.disposal;
      add(`fa-out-${a.uuid}`, a.disposal.at, a.number, `Asset ${a.disposal.kind === "sale" ? "sold" : "scrapped"} — ${a.name}`, [
        dr(bank(undefined, a.disposal.at), proceeds),
        dr("1510", accumulated),
        cr("1500", a.cost),
        gainLoss >= 0 ? cr("4100", gainLoss) : dr("6200", -gainLoss),
      ]);
    }
  }

  return entries.sort((x, y) => x.at.localeCompare(y.at));
};
