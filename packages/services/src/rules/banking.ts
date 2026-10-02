import { round2, sumBy } from "utils";
import { BankAccount, Cheque, Store } from "../../../../db/types";

// THE BANK RULES, pure over the store's data: the movements every document
// implies, a balance at a date, the cheques not yet through the bank, and what
// the month's statement should therefore show.

export type BankMovement = {
  key: string;
  at: string;
  bankAccountUuid: string;
  description: string;
  reference: string;
  /** Positive into the account, negative out of it. */
  amount: number;
  chequeUuid?: string;
};

export type ReconciliationGap = {
  period: string;
  bookBalance: number;
  /** Cheques written but not yet cleared by the end of the month. */
  outstandingIssued: number;
  /** Cheques received and booked but not yet credited by the bank. */
  uncreditedReceived: number;
  /** What the bank statement should show. */
  expectedStatement: number;
};

export const periodEnd = (period: string): string => {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month, 1) - 1).toISOString();
};

export const primaryAccountOf = (store: Pick<Store, "BankAccounts">): BankAccount => {
  const account = store.BankAccounts.find((a) => a.primary) ?? store.BankAccounts[0];
  if (!account) {
    throw new Error("Add a bank account first");
  }
  return account;
};

/** Every movement the documents already record, as bank lines. */
export const bankMovements = (store: Store): BankMovement[] => {
  if (store.BankAccounts.length === 0) {
    return [];
  }
  const primary = primaryAccountOf(store).uuid;
  const lines: BankMovement[] = [];
  for (const inv of store.SupplierInvoices) {
    const supplier = store.Suppliers.find((s) => s.uuid === inv.supplierUuid)?.name ?? "";
    for (const p of inv.payments) {
      lines.push({
        key: `pay-${p.uuid}`,
        at: p.at,
        bankAccountUuid: p.bankAccountUuid ?? primary,
        description: `Payment to ${supplier} — ${inv.number}`,
        reference: p.reference,
        amount: -p.amount,
        chequeUuid: p.chequeUuid,
      });
    }
  }
  for (const inv of store.CustomerInvoices.filter((i) => i.paidAt)) {
    lines.push({
      key: `col-${inv.uuid}`,
      at: inv.paidAt ?? "",
      bankAccountUuid: inv.collectedToUuid ?? primary,
      description: `Collection — ${inv.number}`,
      reference: inv.number,
      amount: inv.total,
      chequeUuid: inv.collectionChequeUuid,
    });
  }
  for (const ex of store.Extracts.filter((e) => e.paidAt)) {
    lines.push({ key: `ex-${ex.uuid}`, at: ex.paidAt ?? "", bankAccountUuid: primary, description: `Subcontractor extract ${ex.number}`, reference: ex.number, amount: -ex.net });
  }
  for (const run of store.PayrollRuns.filter((r) => r.paidAt)) {
    lines.push({
      key: `pay-run-${run.uuid}`,
      at: run.paidAt ?? "",
      bankAccountUuid: primary,
      description: `Salaries ${run.period}`,
      reference: run.bankReference ?? run.number,
      amount: -round2(sumBy(run.payslips, (p) => p.net)),
    });
  }
  for (const e of store.Expenses) {
    lines.push({ key: `exp-${e.uuid}`, at: e.date, bankAccountUuid: primary, description: e.description, reference: e.number, amount: -round2(e.amount + e.vat) });
  }
  for (const c of store.CashCustodies) {
    if (c.disbursedAt) {
      lines.push({ key: `cc-${c.uuid}`, at: c.disbursedAt, bankAccountUuid: primary, description: `Cash custody to ${c.employeeName}`, reference: c.number, amount: -c.amount });
    }
    if (c.settlement && c.settlement.returned > 0) {
      lines.push({
        key: `cc-back-${c.uuid}`,
        at: c.settlement.settledAt,
        bankAccountUuid: primary,
        description: `Custody returned — ${c.employeeName}`,
        reference: c.number,
        amount: c.settlement.returned,
      });
    }
  }
  return lines.sort((a, b) => a.at.localeCompare(b.at));
};

/** The book balance at `asOf`: opening balance plus every movement since the account was opened. */
export const balanceAt = (account: BankAccount, asOf: string, movements: BankMovement[]): number =>
  round2(
    account.openingBalance +
      sumBy(
        movements.filter((m) => m.bankAccountUuid === account.uuid && m.at <= asOf && m.at >= account.openingDate),
        (m) => m.amount,
      ),
  );

/** Cheques pending at `asOf`: written by then, and not cleared or bounced by then. */
export const pendingChequesAt = (cheques: Cheque[], accountUuid: string, direction: Cheque["direction"], asOf: string): number =>
  round2(
    sumBy(
      cheques.filter(
        (c) =>
          c.bankAccountUuid === accountUuid &&
          c.direction === direction &&
          c.issuedAt <= asOf &&
          !(c.clearedAt && c.clearedAt <= asOf) &&
          !(c.bouncedAt && c.bouncedAt <= asOf),
      ),
      (c) => c.amount,
    ),
  );

/** The statement should show the book, plus cheques not yet presented, less cheques not yet credited. */
export const reconciliationGap = (store: Store, account: BankAccount, period: string): ReconciliationGap => {
  const end = periodEnd(period);
  const bookBalance = balanceAt(account, end, bankMovements(store));
  const outstandingIssued = pendingChequesAt(store.Cheques, account.uuid, "issued", end);
  const uncreditedReceived = pendingChequesAt(store.Cheques, account.uuid, "received", end);
  return {
    period,
    bookBalance,
    outstandingIssued,
    uncreditedReceived,
    expectedStatement: round2(bookBalance + outstandingIssued - uncreditedReceived),
  };
};
