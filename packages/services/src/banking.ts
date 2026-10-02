import { formatMoney, generateUuid, nextDocumentNumber, nowIso, round2, toIso } from "utils";
import { BankAccountInput, BounceChequeInput, GuaranteeInput, ReconciliationInput } from "validators";
import { readStore, transact } from "../../../db";
import { BankAccount, BankReconciliation, Cheque, LetterOfGuarantee, Project, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertNotFuture, assertRole, findOrThrow } from "./core/lookup";
import { FINANCE_EDITORS } from "./core/roles";
import {
  BankMovement,
  ReconciliationGap,
  balanceAt,
  bankMovements,
  pendingChequesAt,
  primaryAccountOf,
  reconciliationGap,
} from "./rules/banking";

// BANKS, CHEQUES AND GUARANTEES (finance §9 operational reports, §5 bank
// reconciliation). A bank account's balance is never stored: it is the opening
// balance plus every movement the system already knows — supplier payments,
// customer collections, paid extracts, salaries, expenses, cash custody — so the
// book and the documents cannot disagree (rules/banking.ts).
//
// Cheques are booked when written; the bank sees them when they clear. The
// month's reconciliation explains the difference between the statement and the
// book by the cheques not yet cleared, and must come out exact.

export type BankAccountRow = BankAccount & {
  balance: number;
  pendingIssued: number;
  pendingReceived: number;
  lastReconciled?: string;
};

export type BankAccountDetail = {
  account: BankAccountRow;
  period: string;
  opening: number;
  movements: (BankMovement & { balance: number })[];
  closing: number;
  gap: ReconciliationGap;
  reconciliation: BankReconciliation | null;
  history: BankReconciliation[];
};

export type ChequeRow = Cheque & {
  bankAccountCode: string;
  /** Pending and due after today. */
  postdated: boolean;
};

export type GuaranteeRow = LetterOfGuarantee & {
  projectCode?: Project["code"];
  status: "active" | "expiring" | "expired" | "released";
  daysLeft: number;
};

const GUARANTEE_WARNING_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The account a payment or collection goes through: the one picked, or the primary. */
export const accountFor = (store: Store, uuid: string | undefined): BankAccount =>
  uuid ? findOrThrow(store.BankAccounts, uuid, "Bank account") : primaryAccountOf(store);

/** Writes the cheque that goes with a payment or collection. */
export const writeCheque = (store: Store, input: Omit<Cheque, "uuid" | "status">): Cheque => {
  if (store.Cheques.some((c) => c.direction === input.direction && c.bankAccountUuid === input.bankAccountUuid && c.number === input.number)) {
    throw new Error(`Cheque ${input.number} is already recorded on this account`);
  }
  const cheque: Cheque = { uuid: generateUuid(), status: "pending", ...input };
  store.Cheques.push(cheque);
  return cheque;
};

const toAccountRow = (store: Store, account: BankAccount, movements: BankMovement[]): BankAccountRow => {
  const now = nowIso();
  return {
    ...account,
    balance: balanceAt(account, now, movements),
    pendingIssued: pendingChequesAt(store.Cheques, account.uuid, "issued", now),
    pendingReceived: pendingChequesAt(store.Cheques, account.uuid, "received", now),
    lastReconciled: store.BankReconciliations.filter((r) => r.bankAccountUuid === account.uuid)
      .map((r) => r.period)
      .sort()
      .at(-1),
  };
};

// ─── Reads ─────────────────────────────────────────────────────────────────

export const listBankAccounts = async (): Promise<BankAccountRow[]> => {
  const store = readStore();
  const movements = bankMovements(store);
  return store.BankAccounts.map((a) => toAccountRow(store, a, movements));
};

export const getBankAccount = async (uuid: string, period: string): Promise<BankAccountDetail> => {
  const store = readStore();
  const account = findOrThrow(store.BankAccounts, uuid, "Bank account");
  const all = bankMovements(store);
  const first = `${period}-01T00:00:00.000Z`;
  const opening = balanceAt(account, new Date(new Date(first).getTime() - 1).toISOString(), all);
  let running = opening;
  const movements = all
    .filter((m) => m.bankAccountUuid === uuid && m.at.slice(0, 7) === period && m.at >= account.openingDate)
    .map((m) => {
      running = round2(running + m.amount);
      return { ...m, balance: running };
    });
  return {
    account: toAccountRow(store, account, all),
    period,
    opening,
    movements,
    closing: running,
    gap: reconciliationGap(store, account, period),
    reconciliation: store.BankReconciliations.find((r) => r.bankAccountUuid === uuid && r.period === period) ?? null,
    history: store.BankReconciliations.filter((r) => r.bankAccountUuid === uuid).sort((a, b) => b.period.localeCompare(a.period)),
  };
};

export const listCheques = async (): Promise<ChequeRow[]> => {
  const store = readStore();
  const now = nowIso();
  return [...store.Cheques]
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
    .map((c) => ({
      ...c,
      bankAccountCode: store.BankAccounts.find((a) => a.uuid === c.bankAccountUuid)?.code ?? "",
      postdated: c.status === "pending" && c.dueDate > now,
    }));
};

export const listGuarantees = async (): Promise<GuaranteeRow[]> => {
  const store = readStore();
  const now = Date.now();
  return [...store.LettersOfGuarantee]
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
    .map((g) => {
      const daysLeft = Math.ceil((new Date(g.expiresAt).getTime() - now) / DAY_MS);
      return {
        ...g,
        projectCode: g.projectUuid ? store.Projects.find((p) => p.uuid === g.projectUuid)?.code : undefined,
        daysLeft,
        status: g.releasedAt ? "released" : daysLeft < 0 ? "expired" : daysLeft <= GUARANTEE_WARNING_DAYS ? "expiring" : "active",
      };
    });
};

/** For the closing checklist: the accounts not yet reconciled for the month. */
export const unreconciledAccounts = (store: Store, period: string): string[] =>
  store.BankAccounts.filter((a) => !store.BankReconciliations.some((r) => r.bankAccountUuid === a.uuid && r.period === period)).map((a) => a.code);

// ─── Writes ────────────────────────────────────────────────────────────────

export const createBankAccount = async (actor: Actor, input: BankAccountInput): Promise<BankAccount> => {
  assertRole(actor.role, FINANCE_EDITORS, "add bank accounts");
  return transact((store) => {
    if (store.BankAccounts.some((a) => a.iban === input.iban || a.code.toLowerCase() === input.code.toLowerCase())) {
      throw new Error("An account with this code or IBAN already exists");
    }
    const account: BankAccount = {
      uuid: generateUuid(),
      code: input.code.toUpperCase(),
      name: input.name,
      bank: input.bank,
      iban: input.iban,
      openingBalance: round2(input.openingBalance),
      openingDate: toIso(input.openingDate),
      primary: store.BankAccounts.length === 0,
    };
    store.BankAccounts.push(account);
    logActivity(store, { actorName: actor.name, entity: "bank_account", entityUuid: account.uuid, entityLabel: account.code, action: "Bank account added", detail: `${account.bank} — ${account.name}` });
    return account;
  });
};

export const clearCheque = async (actor: Actor, uuid: string): Promise<void> => {
  assertRole(actor.role, FINANCE_EDITORS, "clear cheques");
  transact((store) => {
    const cheque = findOrThrow(store.Cheques, uuid, "Cheque");
    if (cheque.status !== "pending") {
      throw new Error("Only a pending cheque clears");
    }
    if (cheque.dueDate > nowIso()) {
      throw new Error("A post-dated cheque cannot clear before its due date");
    }
    cheque.status = "cleared";
    cheque.clearedAt = nowIso();
    logActivity(store, { actorName: actor.name, entity: "cheque", entityUuid: cheque.uuid, entityLabel: cheque.number, action: "Cheque cleared", detail: formatMoney(cheque.amount) });
  });
};

/**
 * A bounced cheque undoes what it paid: an issued cheque's supplier payment is
 * taken off the invoice (which is owed again), a received cheque's collection is
 * reopened.
 */
export const bounceCheque = async (actor: Actor, uuid: string, input: BounceChequeInput): Promise<void> => {
  assertRole(actor.role, FINANCE_EDITORS, "record bounced cheques");
  transact((store) => {
    const cheque = findOrThrow(store.Cheques, uuid, "Cheque");
    if (cheque.status !== "pending") {
      throw new Error("Only a pending cheque can bounce");
    }
    cheque.status = "bounced";
    cheque.bouncedAt = nowIso();
    cheque.bounceReason = input.reason;
    if (cheque.ref.kind === "supplier_invoice") {
      const invoice = findOrThrow(store.SupplierInvoices, cheque.ref.uuid, "Invoice");
      invoice.payments = invoice.payments.filter((p) => p.chequeUuid !== cheque.uuid);
      invoice.status = "approved";
    } else {
      const invoice = findOrThrow(store.CustomerInvoices, cheque.ref.uuid, "Invoice");
      invoice.paidAt = undefined;
      invoice.collectedToUuid = undefined;
      invoice.collectionChequeUuid = undefined;
    }
    logActivity(store, {
      actorName: actor.name,
      entity: "cheque",
      entityUuid: cheque.uuid,
      entityLabel: cheque.number,
      action: "Cheque bounced",
      detail: `${cheque.ref.label} reopened — ${input.reason}`,
    });
  });
};

/** The month is reconciled only when the statement equals the book adjusted for uncleared cheques. */
export const reconcileBankAccount = async (actor: Actor, uuid: string, input: ReconciliationInput): Promise<void> => {
  assertRole(actor.role, FINANCE_EDITORS, "reconcile bank accounts");
  transact((store) => {
    const account = findOrThrow(store.BankAccounts, uuid, "Bank account");
    if (input.period > nowIso().slice(0, 7)) {
      throw new Error("A month is reconciled once it has started");
    }
    if (store.BankReconciliations.some((r) => r.bankAccountUuid === uuid && r.period === input.period)) {
      throw new Error(`${account.code} is already reconciled for ${input.period}`);
    }
    const gap = reconciliationGap(store, account, input.period);
    const difference = round2(input.statementBalance - gap.expectedStatement);
    if (Math.abs(difference) > 0.01) {
      throw new Error(
        `The statement differs by ${formatMoney(difference)} from the book adjusted for uncleared cheques (${formatMoney(gap.expectedStatement)}) — find the difference first`,
      );
    }
    store.BankReconciliations.push({
      uuid: generateUuid(),
      bankAccountUuid: uuid,
      period: input.period,
      statementBalance: round2(input.statementBalance),
      bookBalance: gap.bookBalance,
      outstandingIssued: gap.outstandingIssued,
      uncreditedReceived: gap.uncreditedReceived,
      by: actor.name,
      at: nowIso(),
    });
    logActivity(store, { actorName: actor.name, entity: "bank_account", entityUuid: uuid, entityLabel: account.code, action: "Bank reconciled", detail: input.period });
  });
};

export const createGuarantee = async (actor: Actor, input: GuaranteeInput): Promise<LetterOfGuarantee> => {
  assertRole(actor.role, FINANCE_EDITORS, "record letters of guarantee");
  const issuedAt = toIso(input.issuedAt);
  assertNotFuture(issuedAt);
  return transact((store) => {
    if (input.projectUuid) {
      findOrThrow(store.Projects, input.projectUuid, "Project");
    }
    if (store.LettersOfGuarantee.some((g) => g.number === input.number.trim())) {
      throw new Error("A letter of guarantee with this number is already recorded");
    }
    const guarantee: LetterOfGuarantee = {
      uuid: generateUuid(),
      number: input.number.trim() || nextDocumentNumber("LG", store.LettersOfGuarantee.map((g) => g.number)),
      bank: input.bank,
      kind: input.kind,
      beneficiary: input.beneficiary,
      projectUuid: input.projectUuid || undefined,
      amount: round2(input.amount),
      issuedAt,
      expiresAt: toIso(input.expiresAt),
      note: input.note?.trim() || undefined,
    };
    store.LettersOfGuarantee.push(guarantee);
    logActivity(store, { actorName: actor.name, entity: "guarantee", entityUuid: guarantee.uuid, entityLabel: guarantee.number, action: "Letter of guarantee recorded", detail: `${guarantee.beneficiary} — ${formatMoney(guarantee.amount)}` });
    return guarantee;
  });
};

export const releaseGuarantee = async (actor: Actor, uuid: string): Promise<void> => {
  assertRole(actor.role, FINANCE_EDITORS, "release letters of guarantee");
  transact((store) => {
    const guarantee = findOrThrow(store.LettersOfGuarantee, uuid, "Guarantee");
    if (guarantee.releasedAt) {
      throw new Error("Already released");
    }
    guarantee.releasedAt = nowIso();
    logActivity(store, { actorName: actor.name, entity: "guarantee", entityUuid: guarantee.uuid, entityLabel: guarantee.number, action: "Letter of guarantee released" });
  });
};
