import { formatMoney, generateUuid, nowIso, recentPeriods, round2, sumBy } from "utils";
import { TaxFilingInput } from "validators";
import { readStore, transact } from "../../../db";
import { ObligationKind } from "../../../db/enum";
import { OBLIGATION_KIND_LABELS } from "../../../db/label";
import { Store, TaxFiling } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertRole } from "./core/lookup";
import { FINANCE_EDITORS } from "./core/roles";
import { vatPeriods } from "./receivables";

// TAX AND INSURANCE OBLIGATIONS (tax §8): each month's VAT return and social
// insurance, with their due dates, and an alert seven days before. Assumptions
// (docs/finance.md): VAT is filed monthly, by the last day of the next month;
// GOSI is paid by the 15th of the next month, from that month's payroll run.

export type ObligationStatus = "filed" | "overdue" | "due_soon" | "upcoming";

export type ObligationRow = {
  key: string;
  kind: ObligationKind;
  period: string;
  dueAt: string;
  /** VAT: output less input (negative = refundable). GOSI: both shares. */
  amount: number;
  filing: TaxFiling | null;
  status: ObligationStatus;
  daysLeft: number;
};

export const OBLIGATION_WARNING_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const dueDate = (kind: ObligationKind, period: string): string => {
  const [year, month] = period.split("-").map(Number);
  return kind === "vat"
    ? new Date(Date.UTC(year, month + 1, 1) - 1).toISOString()
    : new Date(Date.UTC(year, month, 15, 23, 59, 59)).toISOString();
};

const amountFor = (store: Store, kind: ObligationKind, period: string): number => {
  if (kind === "vat") {
    return vatPeriods(store).find((v) => v.period === period)?.net ?? 0;
  }
  const run = store.PayrollRuns.find((r) => r.period === period);
  return run ? round2(sumBy(run.payslips, (p) => p.gosiEmployee + p.gosiEmployer)) : 0;
};

/** The last six completed months' VAT returns and GOSI payments, with what is filed. */
export const obligationsFor = (store: Store, now: string): ObligationRow[] =>
  recentPeriods(7, now)
    .slice(1)
    .flatMap((period) =>
      (["vat", "gosi"] as const).map((kind): ObligationRow => {
        const dueAt = dueDate(kind, period);
        const filing = store.TaxFilings.find((f) => f.kind === kind && f.period === period) ?? null;
        const daysLeft = Math.ceil((new Date(dueAt).getTime() - new Date(now).getTime()) / DAY_MS);
        return {
          key: `${kind}-${period}`,
          kind,
          period,
          dueAt,
          amount: filing?.amount ?? amountFor(store, kind, period),
          filing,
          daysLeft,
          status: filing ? "filed" : daysLeft < 0 ? "overdue" : daysLeft <= OBLIGATION_WARNING_DAYS ? "due_soon" : "upcoming",
        };
      }),
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));

export const listObligations = async (): Promise<ObligationRow[]> => obligationsFor(readStore(), nowIso());

/** Records a return as filed (or GOSI as paid) with its reference; the amount is fixed then. */
export const fileObligation = async (actor: Actor, input: TaxFilingInput): Promise<TaxFiling> => {
  assertRole(actor.role, FINANCE_EDITORS, "file tax returns");
  return transact((store) => {
    if (input.period >= nowIso().slice(0, 7)) {
      throw new Error("A month is filed once it has ended");
    }
    if (store.TaxFilings.some((f) => f.kind === input.kind && f.period === input.period)) {
      throw new Error(`The ${OBLIGATION_KIND_LABELS[input.kind]} for ${input.period} is already filed`);
    }
    if (input.kind === "gosi" && !store.PayrollRuns.some((r) => r.period === input.period && r.status !== "draft")) {
      throw new Error("Social insurance is paid on an approved payroll — approve the month's payroll first");
    }
    const filing: TaxFiling = {
      uuid: generateUuid(),
      kind: input.kind,
      period: input.period,
      amount: amountFor(store, input.kind, input.period),
      reference: input.reference,
      filedAt: nowIso(),
      by: actor.name,
    };
    store.TaxFilings.push(filing);
    logActivity(store, {
      actorName: actor.name,
      entity: "tax_filing",
      entityUuid: filing.uuid,
      entityLabel: `${input.kind.toUpperCase()} ${input.period}`,
      action: `${OBLIGATION_KIND_LABELS[input.kind]} filed`,
      detail: `${formatMoney(filing.amount)} — ${input.reference}`,
    });
    return filing;
  });
};
