import { z } from "zod";
import { budgetCategories, closingItems, paymentMethods } from "../../../db/enum";
import { dateField, money, optionalNote, requiredText } from "./common";

export const supplierInvoiceSchema = z.object({
  supplierUuid: z.string().min(1, "Pick the supplier"),
  invoiceNumber: requiredText("Invoice number"),
  invoiceDate: dateField,
  poUuid: z.string().min(1, "Link the invoice to its PO"),
  grnUuids: z.array(z.string()).min(1, "Link at least one goods receipt"),
  subtotal: money,
  vat: money,
  total: money,
});

export type SupplierInvoiceInput = z.infer<typeof supplierInvoiceSchema>;

/** The account and, for a cheque, its number and due date — shared by payments and collections. */
const bankFields = {
  method: z.enum(paymentMethods),
  /** Empty = the primary account. */
  bankAccountUuid: z.string(),
  chequeNumber: z.string().trim().max(40),
  /** Empty unless a cheque; a later date makes it post-dated. */
  chequeDueDate: z.string(),
};

const chequeComplete = (v: { method: string; chequeNumber: string; chequeDueDate: string }) =>
  v.method !== "cheque" || (v.chequeNumber.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(v.chequeDueDate));

const CHEQUE_MESSAGE = { message: "A cheque needs its number and due date", path: ["chequeNumber"] };

export const paymentSchema = z
  .object({
    ...bankFields,
    reference: requiredText("Reference"),
    amount: money.refine((v) => v > 0, "Amount must be more than 0"),
    paidAt: dateField,
  })
  .refine(chequeComplete, CHEQUE_MESSAGE);

export type PaymentInput = z.infer<typeof paymentSchema>;

export const subcontractSchema = z.object({
  subcontractorUuid: z.string().min(1, "Pick the subcontractor"),
  projectUuid: z.string().min(1, "Pick the project"),
  scope: requiredText("Scope"),
  budgetCategory: z.enum(budgetCategories),
  value: money.refine((v) => v > 0, "Value must be more than 0"),
  retentionPct: z.coerce.number<string | number>().min(0).max(30),
  advancePaid: money,
});

export type SubcontractInput = z.infer<typeof subcontractSchema>;

export const extractSchema = z.object({
  subcontractUuid: z.string().min(1, "Pick the subcontract"),
  periodFrom: dateField,
  periodTo: dateField,
  lines: z
    .array(
      z.object({
        description: requiredText("Description"),
        unit: requiredText("Unit"),
        qty: money.refine((v) => v > 0, "More than 0"),
        unitRate: money,
      }),
    )
    .min(1, "Add at least one executed quantity"),
});

export type ExtractInput = z.infer<typeof extractSchema>;

export const extractDecisionSchema = z
  .object({
    decision: z.enum(["approved", "rejected"]),
    note: optionalNote,
    /** Delay or breach penalties, set by whoever approves (finance §2 step 5). */
    penalties: money.optional(),
    penaltyNote: optionalNote,
  })
  .refine((v) => v.decision === "approved" || Boolean(v.note?.trim()), {
    message: "A rejection needs a reason",
    path: ["note"],
  });

export type ExtractDecisionInput = z.infer<typeof extractDecisionSchema>;

export const asBuiltInvoiceSchema = z.object({
  projectUuid: z.string().min(1, "Pick the project"),
  amount: money.refine((v) => v > 0, "Amount must be more than 0"),
  submittedAt: dateField,
  paymentTermsDays: z.coerce.number<string | number>().int().min(0).max(365),
});

export type AsBuiltInvoiceInput = z.infer<typeof asBuiltInvoiceSchema>;

export const collectionSchema = z
  .object({
    ...bankFields,
    paidAt: dateField,
  })
  .refine(chequeComplete, CHEQUE_MESSAGE);

export type CollectionInput = z.infer<typeof collectionSchema>;

export const closingTickSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/),
  item: z.enum(closingItems),
});

export type ClosingTickInput = z.infer<typeof closingTickSchema>;

export const budgetLinesSchema = z.object({
  lines: z.array(z.object({ category: z.enum(budgetCategories), planned: money })),
  reason: optionalNote,
});

export type BudgetLinesFormInput = z.infer<typeof budgetLinesSchema>;
