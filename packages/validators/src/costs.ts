import { z } from "zod";
import {
  budgetCategories,
  costCenterKinds,
  equipmentSupplyTypes,
  expenseCategories,
  overheadBases,
  studyResources,
  workTypes,
} from "../../../db/enum";
import { dateField, money, optionalNote, positiveQty, requiredText } from "./common";
import { periodField } from "./payroll";

export const studyLineSchema = z.object({
  category: z.enum(budgetCategories),
  description: requiredText("Description"),
  unit: requiredText("Unit"),
  qty: positiveQty,
  unitCost: money,
  /** 0 when it does not apply. */
  duration: money,
  supplyType: z.enum(equipmentSupplyTypes).or(z.literal("")),
  workType: z.enum(workTypes).or(z.literal("")),
});

export type StudyLineInput = z.infer<typeof studyLineSchema>;

export const scheduleItemSchema = z
  .object({
    resource: z.enum(studyResources),
    description: requiredText("Description"),
    startsAt: dateField,
    endsAt: dateField,
  })
  .refine((v) => v.endsAt >= v.startsAt, { message: "Ends before it starts", path: ["endsAt"] });

export type ScheduleItemInput = z.infer<typeof scheduleItemSchema>;

export const applyStudySchema = z.object({
  reason: optionalNote,
});

export type ApplyStudyInput = z.infer<typeof applyStudySchema>;

export const costCenterSchema = z.object({
  code: requiredText("Code"),
  name: requiredText("Name"),
  kind: z.enum(costCenterKinds),
});

export type CostCenterInput = z.infer<typeof costCenterSchema>;

export const expenseSchema = z.object({
  date: dateField,
  description: requiredText("Description"),
  category: z.enum(expenseCategories),
  budgetCategory: z.enum(budgetCategories),
  amount: money.refine((v) => v > 0, "Enter the amount"),
  vat: money,
  allocations: z.array(z.object({ costCenterUuid: z.string().min(1, "Pick a cost centre"), amount: money })),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export const overheadPostingSchema = z.object({
  period: periodField,
  basis: z.enum(overheadBases),
});

export type OverheadPostingInput = z.infer<typeof overheadPostingSchema>;
