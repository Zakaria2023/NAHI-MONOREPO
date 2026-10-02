import { addDays, formatMoney, generateUuid, nextDocumentNumber, nowIso, periodOf, round2, sumBy, toIso } from "utils";
import { AsBuiltInvoiceInput, CollectionInput } from "validators";
import { readStore, transact } from "../../../db";
import { CUSTOMER_INVOICE_BASIS_LABELS } from "../../../db/label";
import { CustomerInvoice, Project, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertNotFuture, assertRole, findOrThrow } from "./core/lookup";
import { FINANCE_EDITORS } from "./core/roles";
import { withVat } from "./core/tax";
import { accountFor, writeCheque } from "./banking";
import { AgeingBuckets, ageing } from "./rules/finance";
import { isStcDocumentApproved } from "./rules/stc";

// CUSTOMERS (finance §3): the tax invoice on the approved as-built — or, for
// Mobily, on each certificate (see mobily.ts) — and its collection.

export type CustomerInvoiceRow = CustomerInvoice & {
  projectCode: Project["code"];
  projectName: Project["name"];
  operator: Project["operator"];
  overdue: boolean;
};

export type CustomerAgeingRow = { operator: Project["operator"] } & AgeingBuckets;

export type VatPeriod = {
  period: string;
  output: number;
  input: number;
  net: number;
};

export type VatQuarter = VatPeriod & {
  /** "2026-Q3". */
  quarter: string;
  months: string[];
};

export const listCustomerInvoices = async (): Promise<CustomerInvoiceRow[]> => {
  const store = readStore();
  const now = nowIso();
  return [...store.CustomerInvoices].reverse().map((invoice) => {
    const project = findOrThrow(store.Projects, invoice.projectUuid, "Project");
    return {
      ...invoice,
      projectCode: project.code,
      projectName: project.name,
      operator: project.operator,
      overdue: !invoice.paidAt && invoice.dueAt < now,
    };
  });
};

/** For STC: the As-Built must be approved by the Inspector and the Supervisor first. */
export const createAsBuiltInvoice = async (actor: Actor, input: AsBuiltInvoiceInput): Promise<CustomerInvoice> => {
  assertRole(actor.role, FINANCE_EDITORS, "create customer invoices");
  const submittedAt = toIso(input.submittedAt);
  assertNotFuture(submittedAt);
  return transact((store) => {
    const project = findOrThrow(store.Projects, input.projectUuid, "Project");
    if (project.mobily) {
      throw new Error("Mobily projects are invoiced per certificate — use the project's Invoices section");
    }
    if (!project.stc || !isStcDocumentApproved(project.stc, "as_built")) {
      throw new Error("The As-Built must be approved before it is invoiced");
    }
    const amount = round2(input.amount);
    const invoice: CustomerInvoice = {
      uuid: generateUuid(),
      number: nextDocumentNumber("CI", store.CustomerInvoices.map((i) => i.number)),
      projectUuid: project.uuid,
      basis: "as_built",
      amount,
      ...withVat(amount),
      submittedAt,
      dueAt: addDays(submittedAt, input.paymentTermsDays),
      createdBy: actor.name,
    };
    store.CustomerInvoices.push(invoice);
    logActivity(store, {
      actorName: actor.name,
      entity: "customer_invoice",
      entityUuid: invoice.uuid,
      entityLabel: invoice.number,
      action: "Tax invoice issued",
      detail: `${project.code} ${CUSTOMER_INVOICE_BASIS_LABELS.as_built} — ${formatMoney(invoice.total)}`,
    });
    return invoice;
  });
};

export const recordCustomerCollection = async (
  actor: Actor,
  uuid: string,
  input: CollectionInput,
): Promise<void> => {
  assertRole(actor.role, FINANCE_EDITORS, "record collections");
  const paidAt = toIso(input.paidAt);
  assertNotFuture(paidAt);
  transact((store) => {
    const invoice = findOrThrow(store.CustomerInvoices, uuid, "Invoice");
    if (invoice.paidAt) {
      throw new Error("This invoice is already collected");
    }
    const project = findOrThrow(store.Projects, invoice.projectUuid, "Project");
    const account = accountFor(store, input.bankAccountUuid);
    const cheque =
      input.method === "cheque"
        ? writeCheque(store, {
            number: input.chequeNumber,
            direction: "received",
            bankAccountUuid: account.uuid,
            party: project.operator === "mobily" ? "Mobily" : "STC",
            amount: invoice.total,
            issuedAt: paidAt,
            dueDate: toIso(input.chequeDueDate),
            ref: { kind: "customer_invoice", uuid: invoice.uuid, label: invoice.number },
          })
        : undefined;
    invoice.paidAt = paidAt;
    invoice.collectedToUuid = account.uuid;
    invoice.collectionChequeUuid = cheque?.uuid;
    logActivity(store, {
      actorName: actor.name,
      entity: "customer_invoice",
      entityUuid: invoice.uuid,
      entityLabel: invoice.number,
      action: "Payment collected",
      detail: formatMoney(invoice.total),
    });
  });
};

export const customerAgeing = async (): Promise<CustomerAgeingRow[]> => {
  const store = readStore();
  const now = nowIso();
  return (["mobily", "stc"] as const).map((operator) => ({
    operator,
    ...ageing(
      store.CustomerInvoices.filter(
        (i) => !i.paidAt && store.Projects.find((p) => p.uuid === i.projectUuid)?.operator === operator,
      ).map((i) => ({ dueAt: i.dueAt, outstanding: i.total })),
      now,
    ),
  }));
};

/** Tax §8: output VAT from customer invoices, input VAT from supplier invoices and expenses, by month. */
export const vatSummary = async (): Promise<VatPeriod[]> => vatPeriods(readStore());

/** The quarterly return: the months added up by calendar quarter. */
export const vatQuarters = async (): Promise<VatQuarter[]> => {
  const quarters = new Map<string, VatQuarter>();
  for (const month of vatPeriods(readStore())) {
    const [year, m] = month.period.split("-").map(Number);
    const quarter = `${year}-Q${Math.ceil(m / 3)}`;
    const row = quarters.get(quarter) ?? { quarter, period: quarter, months: [], output: 0, input: 0, net: 0 };
    quarters.set(quarter, {
      ...row,
      months: [...row.months, month.period].sort(),
      output: round2(row.output + month.output),
      input: round2(row.input + month.input),
      net: round2(row.net + month.net),
    });
  }
  return [...quarters.values()].sort((a, b) => b.quarter.localeCompare(a.quarter));
};

export const vatPeriods = (store: Store): VatPeriod[] => {
  const periods = new Map<string, { output: number; input: number }>();
  const add = (period: string, key: "output" | "input", amount: number) => {
    const row = periods.get(period) ?? { output: 0, input: 0 };
    row[key] = round2(row[key] + amount);
    periods.set(period, row);
  };
  for (const invoice of store.CustomerInvoices) {
    add(periodOf(invoice.submittedAt), "output", invoice.vat);
  }
  for (const invoice of store.SupplierInvoices.filter((i) => i.status !== "rejected")) {
    add(periodOf(invoice.invoiceDate), "input", invoice.vat);
  }
  for (const expense of store.Expenses.filter((e) => e.vat > 0)) {
    add(periodOf(expense.date), "input", expense.vat);
  }
  return [...periods.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([period, row]) => ({ period, ...row, net: round2(row.output - row.input) }));
};

export const receivablesTotal = async (): Promise<number> =>
  round2(sumBy(readStore().CustomerInvoices.filter((i) => !i.paidAt), (i) => i.total));
