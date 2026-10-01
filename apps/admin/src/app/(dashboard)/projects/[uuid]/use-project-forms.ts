"use client";

import { ChangeEvent } from "react";
import { nowIso, toDateInput } from "utils";
import {
  addLabTestSchema,
  addPermitSchema,
  assignInspectorSchema,
  certificateInvoiceSchema,
  collectionSchema,
  issuePermitSchema,
  labTestResultSchema,
  milestoneFlagsSchema,
  mobilyStepSchema,
  stcDesignSchema,
  stcStepSchema,
  stcUploadSchema,
} from "validators";
import { CertificateKind, MobilyStep, StcDocumentKey, StcM3Check, StcPatStep } from "@/db/enum";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

// The forms of the project page, one hook each. They take the action already
// bound to the project, because the page (a server component) does the binding.

const today = () => toDateInput(nowIso());

export const useMobilyStepForm = (action: FormAction, step: MobilyStep) =>
  useActionForm(mobilyStepSchema, action, { step, at: today(), note: "", poNumber: "" });

export const usePermitForm = (action: FormAction) =>
  useActionForm(addPermitSchema, action, { authority: "municipality", reference: "", requestedAt: today(), durationDays: 30 });

export const useIssuePermitForm = (action: FormAction, permitUuid: string) =>
  useActionForm(issuePermitSchema, action, { permitUuid, issuedAt: today() });

export const useLabTestForm = (action: FormAction) =>
  useActionForm(addLabTestSchema, action, { lab: "municipal", subject: "civil_works" });

export const useLabResultForm = (action: FormAction, testUuid: string) =>
  useActionForm(labTestResultSchema, action, { testUuid, status: "passed", testedAt: today(), note: "" });

export const useCertificateInvoiceForm = (action: FormAction, kind: CertificateKind, amount: number) =>
  useActionForm(certificateInvoiceSchema, action, { kind, amount, submittedAt: today() });

export const useCollectionForm = (action: FormAction) => useActionForm(collectionSchema, action, { paidAt: today() });

export const useDesignForm = (action: FormAction) =>
  useActionForm(stcDesignSchema, action, { designClosedAt: today(), designEndDate: nowIso().slice(0, 16) });

/** Picking a file submits straight away, as an upload button does. */
export const useUploadForm = (action: FormAction, key: StcDocumentKey) => {
  const { form, state, isPending, onSubmit } = useActionForm(stcUploadSchema, action, { key, fileName: "" });
  const onFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("fileName", file.name);
      onSubmit();
    }
  };
  return { state, isPending, onSubmit, onFileChosen };
};

export const useInspectorForm = (action: FormAction) => useActionForm(assignInspectorSchema, action, { inspectorName: "" });

export const useStcStepForm = (action: FormAction, step: StcPatStep | StcM3Check) =>
  useActionForm(stcStepSchema, action, { step, at: today() });

export const useMilestoneFlagsForm = (action: FormAction, qtyIncreased: boolean, newUpl: boolean) =>
  useActionForm(milestoneFlagsSchema, action, { qtyIncreased, newUpl });
