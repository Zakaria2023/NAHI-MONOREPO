"use client";

import { useFormContext } from "react-hook-form";
import { DropdownOption } from "ui";
import { paymentMethods } from "@/db/enum";
import { PAYMENT_METHOD_LABELS } from "@/db/label";
import { DropdownField } from "./dropdown-field";
import { TextField } from "./text-field";

type BankFieldsProps = {
  /** The bank accounts to pick from; without them the money goes through the primary account. */
  accounts?: DropdownOption[];
  /** Fixed-width fields, for a one-row form beside a table line. */
  compact?: boolean;
};

/**
 * How money moved: transfer or cheque, through which account, and — for a
 * cheque — its number and due date (a later date makes it post-dated). The
 * cheque fields appear only when the method is a cheque.
 */
export const BankFields = ({ accounts, compact }: BankFieldsProps) => {
  const { watch } = useFormContext();
  const cheque = watch("method") === "cheque";
  const cell = compact ? "w-40" : "";
  return (
    <>
      <div className={cell}>
        <DropdownField name="method" label="Method" options={paymentMethods.map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }))} />
      </div>
      {accounts && accounts.length > 0 && (
        <div className={cell}>
          <DropdownField name="bankAccountUuid" label="Bank account" options={[{ value: "", label: "Primary account" }, ...accounts]} />
        </div>
      )}
      {cheque && (
        <>
          <div className={cell}>
            <TextField name="chequeNumber" label="Cheque number" />
          </div>
          <div className={cell}>
            <TextField name="chequeDueDate" label="Cheque due date" type="date" />
          </div>
        </>
      )}
    </>
  );
};
