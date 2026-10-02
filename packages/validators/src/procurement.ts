import { z } from "zod";
import {
  approvalDecisions,
  budgetCategories,
  inventoryFrequencies,
  itemCategories,
  itemKinds,
  recipientKinds,
  supplierReturnRemedies,
  writeOffDecisions,
  writeOffReasons,
} from "../../../db/enum";
import { dateField, money, optionalNote, positiveQty, requiredText } from "./common";

export const decisionSchema = z
  .object({
    decision: z.enum(approvalDecisions),
    note: optionalNote,
  })
  .refine((v) => v.decision === "approved" || Boolean(v.note?.trim()), {
    message: "A rejection needs a reason",
    path: ["note"],
  });

export type DecisionFormInput = z.infer<typeof decisionSchema>;

/** Saudi VAT numbers: 15 digits, starting and ending with 3. */
export const vatNumber = z
  .string()
  .trim()
  .regex(/^3\d{13}3$/, "A VAT number is 15 digits, starting and ending with 3");

export const supplierSchema = z.object({
  name: requiredText("Trade name"),
  vatNumber,
  crNumber: requiredText("CR number"),
  address: requiredText("Address"),
  email: z.email("Enter a valid e-mail"),
  phone: requiredText("Phone"),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

export const itemSchema = z.object({
  code: requiredText("Code"),
  name: requiredText("Name"),
  category: z.enum(itemCategories),
  kind: z.enum(itemKinds),
  unit: requiredText("Unit"),
  reorderLevel: money,
  standardCost: money,
});

export type ItemInput = z.infer<typeof itemSchema>;

const quantityLine = z.object({
  itemUuid: z.string().min(1, "Pick an item"),
  qty: positiveQty,
});

export const purchaseRequestSchema = z.object({
  projectUuid: z.string().min(1, "Pick a project"),
  department: requiredText("Department"),
  budgetCategory: z.enum(budgetCategories),
  note: optionalNote,
  lines: z
    .array(
      quantityLine.extend({
        estUnitPrice: money,
        expectedDate: dateField,
      }),
    )
    .min(1, "Add at least one item"),
});

export type PurchaseRequestInput = z.infer<typeof purchaseRequestSchema>;

export const procurementReviewSchema = z.object({
  stockAvailable: z.boolean(),
});

export type ProcurementReviewInput = z.infer<typeof procurementReviewSchema>;

export const quotationSchema = z.object({
  supplierUuid: z.string().min(1, "Pick a supplier"),
  deliveryDays: z.coerce.number<string | number>().int().min(0),
  paymentTermsDays: z.coerce.number<string | number>().int().min(0),
  qualityScore: z.coerce.number<string | number>().int().min(1).max(5),
  previouslyApproved: z.boolean(),
  lines: z.array(quantityLine.extend({ unitPrice: money })).min(1, "Price at least one item"),
});

export type QuotationInput = z.infer<typeof quotationSchema>;

export const selectQuotationSchema = z.object({
  quotationUuid: z.string().min(1, "Pick the winning quotation"),
});

export type SelectQuotationInput = z.infer<typeof selectQuotationSchema>;

export const cancelPurchaseOrderSchema = z.object({
  note: requiredText("Reason"),
});

export type CancelPurchaseOrderInput = z.infer<typeof cancelPurchaseOrderSchema>;

export const advancePaymentSchema = z.object({
  amount: money.refine((v) => v > 0, "Amount must be more than 0"),
});

export type AdvancePaymentInput = z.infer<typeof advancePaymentSchema>;

export const goodsReceiptSchema = z.object({
  warehouseUuid: z.string().min(1, "Pick a warehouse"),
  receivedAt: dateField,
  lines: z
    .array(
      z.object({
        itemUuid: z.string().min(1),
        receivedQty: money,
        acceptedQty: money,
        rejectionReason: z.string().trim().max(200).optional(),
      }),
    )
    .min(1),
});

export type GoodsReceiptInput = z.infer<typeof goodsReceiptSchema>;

const score = z.coerce.number<string | number>().int().min(1).max(5);

export const supplierEvaluationSchema = z.object({
  quality: score,
  onTime: score,
  price: score,
  note: optionalNote,
});

export type SupplierEvaluationInput = z.infer<typeof supplierEvaluationSchema>;

export const issueRequestSchema = z.object({
  projectUuid: z.string().min(1, "Pick a project"),
  warehouseUuid: z.string().min(1, "Pick a warehouse"),
  recipientKind: z.enum(recipientKinds),
  recipientName: requiredText("Recipient"),
  subcontractorUuid: z.string().optional(),
  inventoryFrequency: z.enum(inventoryFrequencies).optional(),
  lines: z.array(quantityLine).min(1, "Add at least one item"),
});

export type IssueRequestInput = z.infer<typeof issueRequestSchema>;

export const issueStockSchema = z.object({
  signedByRecipient: requiredText("Recipient signature"),
});

export type IssueStockInput = z.infer<typeof issueStockSchema>;

export const transferSchema = z
  .object({
    fromWarehouseUuid: z.string().min(1, "Pick the source"),
    toWarehouseUuid: z.string().min(1, "Pick the destination"),
    lines: z.array(quantityLine).min(1, "Add at least one item"),
  })
  .refine((v) => v.fromWarehouseUuid !== v.toWarehouseUuid, {
    message: "Pick two different warehouses",
    path: ["toWarehouseUuid"],
  });

export type TransferInput = z.infer<typeof transferSchema>;

export const stocktakeSchema = z.object({
  warehouseUuid: z.string().min(1, "Pick a warehouse"),
  countedAt: dateField,
  lines: z
    .array(z.object({ itemUuid: z.string().min(1), actualQty: money }))
    .min(1, "Count at least one item"),
});

export type StocktakeInput = z.infer<typeof stocktakeSchema>;

export const writeOffSchema = z
  .object({
    warehouseUuid: z.string().min(1, "Pick a warehouse"),
    reason: z.enum(writeOffReasons),
    investigation: requiredText("Investigation summary"),
    decision: z.enum(writeOffDecisions),
    chargedEmployee: z.string().trim().max(120).optional(),
    lines: z.array(quantityLine).min(1, "Add at least one item"),
  })
  .refine((v) => v.decision !== "charge_employee" || Boolean(v.chargedEmployee?.trim()), {
    message: "Name the employee charged",
    path: ["chargedEmployee"],
  });

export type WriteOffInput = z.infer<typeof writeOffSchema>;

export const assetReturnSchema = z.object({
  status: z.enum(["returned", "lost", "damaged"]),
});

export type AssetReturnInput = z.infer<typeof assetReturnSchema>;

export const cashCustodySchema = z.object({
  employeeName: requiredText("Employee"),
  projectUuid: z.string().min(1, "Pick a project"),
  budgetCategory: z.enum(budgetCategories),
  city: requiredText("City"),
  workOrderNo: requiredText("Work order number"),
  lines: z
    .array(z.object({ description: requiredText("Description"), amount: money.refine((v) => v > 0, "More than 0") }))
    .min(1, "Add at least one line"),
});

export type CashCustodyInput = z.infer<typeof cashCustodySchema>;

export const settleCustodySchema = z.object({
  spent: money,
  note: optionalNote,
});

export type SettleCustodyInput = z.infer<typeof settleCustodySchema>;

export const clearanceSchema = z.object({
  employeeName: requiredText("Employee"),
  reason: z.enum(["resignation", "transfer"]),
});

export type ClearanceInput = z.infer<typeof clearanceSchema>;

const percent = z.coerce.number<string | number>().min(0, "Cannot be negative").max(100, "At most 100 %");

const days = z.coerce.number<string | number>().int("Whole days").min(0, "Cannot be negative");

export const supplierContractSchema = z
  .object({
    supplierUuid: z.string().min(1, "Pick a supplier"),
    title: requiredText("Title"),
    startsAt: dateField,
    endsAt: dateField,
    deliveryDays: days,
    paymentTermsDays: days,
    latePenaltyPctPerDay: percent,
    latePenaltyCapPct: percent,
    lines: z
      .array(z.object({ itemUuid: z.string().min(1, "Pick an item"), unitPrice: money.refine((v) => v > 0, "Price the item") }))
      .min(1, "Price at least one item"),
  })
  .refine((v) => v.endsAt > v.startsAt, { message: "The contract must end after it starts", path: ["endsAt"] });

export type SupplierContractInput = z.infer<typeof supplierContractSchema>;

export const orderUnderContractSchema = z.object({
  contractUuid: z.string().min(1, "Pick a contract"),
});

export type OrderUnderContractInput = z.infer<typeof orderUnderContractSchema>;

export const amendPurchaseOrderSchema = z.object({
  deliveryDays: days,
  note: requiredText("Reason"),
  lines: z
    .array(z.object({ itemUuid: z.string().min(1), qty: positiveQty, unitPrice: money }))
    .min(1, "A PO needs at least one line"),
});

export type AmendPurchaseOrderInput = z.infer<typeof amendPurchaseOrderSchema>;

export const penaltyTermsSchema = z.object({
  latePenaltyPctPerDay: percent,
  latePenaltyCapPct: percent,
});

export type PenaltyTermsInput = z.infer<typeof penaltyTermsSchema>;

export const supplierReturnSchema = z.object({
  warehouseUuid: z.string().min(1, "Pick a warehouse"),
  itemUuid: z.string().min(1, "Pick an item"),
  qty: positiveQty,
  reason: requiredText("Reason"),
  remedy: z.enum(supplierReturnRemedies),
});

export type SupplierReturnInput = z.infer<typeof supplierReturnSchema>;
