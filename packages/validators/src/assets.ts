import { z } from "zod";
import { assetCategories, assetDisposalKinds, assetHolderKinds } from "../../../db/enum";
import { dateField, money, optionalNote, requiredText } from "./common";
import { periodField } from "./payroll";

const holder = {
  holderKind: z.enum(assetHolderKinds),
  warehouseUuid: z.string(),
  employeeName: z.string().trim().max(120),
};

const holderComplete = (v: { holderKind: string; warehouseUuid: string; employeeName: string }) =>
  v.holderKind === "warehouse" ? v.warehouseUuid.length > 0 : v.employeeName.length > 0;

const HOLDER_MESSAGE = { message: "Pick the warehouse, or name the employee who holds it", path: ["warehouseUuid"] };

export const fixedAssetSchema = z
  .object({
    name: requiredText("Name"),
    category: z.enum(assetCategories),
    serialNumber: requiredText("Serial number"),
    purchaseDate: dateField,
    cost: money.refine((v) => v > 0, "Enter the cost"),
    salvageValue: money,
    usefulLifeMonths: z.coerce.number<string | number>().int("Whole months").min(1, "At least one month").max(600),
    projectUuid: z.string(),
    ...holder,
  })
  .refine((v) => v.salvageValue < v.cost, { message: "Salvage value must be below the cost", path: ["salvageValue"] })
  .refine(holderComplete, HOLDER_MESSAGE);

export type FixedAssetInput = z.infer<typeof fixedAssetSchema>;

export const assetTransferSchema = z
  .object({
    ...holder,
    note: optionalNote,
  })
  .refine(holderComplete, HOLDER_MESSAGE);

export type AssetTransferInput = z.infer<typeof assetTransferSchema>;

export const assetCountSchema = z.object({
  found: z.boolean(),
  condition: requiredText("Condition"),
});

export type AssetCountInput = z.infer<typeof assetCountSchema>;

export const assetDisposalSchema = z.object({
  kind: z.enum(assetDisposalKinds),
  disposedAt: dateField,
  proceeds: money,
  note: optionalNote,
});

export type AssetDisposalInput = z.infer<typeof assetDisposalSchema>;

export const depreciationPostingSchema = z.object({
  period: periodField,
});

export type DepreciationPostingInput = z.infer<typeof depreciationPostingSchema>;
