import { z } from "zod";
import { guaranteeKinds, obligationKinds } from "../../../db/enum";
import { dateField, money, optionalNote, requiredText } from "./common";
import { iban, periodField } from "./payroll";

export const bankAccountSchema = z.object({
  code: requiredText("Code"),
  name: requiredText("Name"),
  bank: requiredText("Bank"),
  iban,
  openingBalance: money,
  openingDate: dateField,
});

export type BankAccountInput = z.infer<typeof bankAccountSchema>;

export const bounceChequeSchema = z.object({
  reason: requiredText("Reason"),
});

export type BounceChequeInput = z.infer<typeof bounceChequeSchema>;

export const reconciliationSchema = z.object({
  period: periodField,
  statementBalance: z.coerce.number<string | number>(),
});

export type ReconciliationInput = z.infer<typeof reconciliationSchema>;

export const guaranteeSchema = z
  .object({
    number: requiredText("Number"),
    bank: requiredText("Bank"),
    kind: z.enum(guaranteeKinds),
    beneficiary: requiredText("Beneficiary"),
    projectUuid: z.string(),
    amount: money.refine((v) => v > 0, "Enter the amount"),
    issuedAt: dateField,
    expiresAt: dateField,
    note: optionalNote,
  })
  .refine((v) => v.expiresAt > v.issuedAt, { message: "Expires before it was issued", path: ["expiresAt"] });

export type GuaranteeInput = z.infer<typeof guaranteeSchema>;

export const statementCheckSchema = z.object({
  asOf: dateField,
  reportedBalance: z.coerce.number<string | number>(),
  note: optionalNote,
});

export type StatementCheckInput = z.infer<typeof statementCheckSchema>;

export const taxFilingSchema = z.object({
  kind: z.enum(obligationKinds),
  period: periodField,
  reference: requiredText("Reference"),
});

export type TaxFilingInput = z.infer<typeof taxFilingSchema>;
