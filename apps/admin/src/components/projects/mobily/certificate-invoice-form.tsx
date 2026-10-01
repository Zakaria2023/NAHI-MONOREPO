"use client";

import { useCertificateInvoiceForm } from "@/app/(dashboard)/projects/[uuid]/use-project-forms";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";
import { CertificateKind } from "@/db/enum";
import { FormAction } from "@/lib/action-result";

type CertificateInvoiceFormProps = {
  action: FormAction;
  kind: CertificateKind;
  suggestedAmount: number;
};

export const CertificateInvoiceForm = ({ action, kind, suggestedAmount }: CertificateInvoiceFormProps) => {
  const { form, state, isPending, onSubmit } = useCertificateInvoiceForm(action, kind, suggestedAmount);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Submit on I-Supplier" layout="inline">
      <div className="w-40">
        <TextField name="amount" label="Amount excl. VAT" type="number" />
      </div>
      <div className="w-40">
        <TextField name="submittedAt" label="Submitted on" type="date" />
      </div>
    </ActionForm>
  );
};
