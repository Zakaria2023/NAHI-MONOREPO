"use client";

import { useProjectForm } from "@/app/(dashboard)/projects/new/use-project-form";
import { ActionForm } from "@/components/forms/action-form";
import { DropdownField } from "@/components/forms/dropdown-field";
import { TextField } from "@/components/forms/text-field";
import { operators, regions } from "@/db/enum";
import { OPERATOR_LABELS, REGION_LABELS } from "@/db/label";

type ProjectFormProps = {
  projectManagerName: string;
};

export const ProjectForm = ({ projectManagerName }: ProjectFormProps) => {
  const { form, state, isPending, onSubmit } = useProjectForm(projectManagerName);
  return (
    <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Create project" columns={2}>
      <TextField name="name" label="Project name" required />
      <DropdownField name="operator" label="Customer" required options={operators.map((o) => ({ value: o, label: OPERATOR_LABELS[o] }))} />
      <TextField name="siteName" label="Site" required placeholder="RUH-OLY-117" />
      <TextField name="city" label="City" required />
      <DropdownField name="region" label="Region" options={regions.map((r) => ({ value: r, label: REGION_LABELS[r] }))} />
      <TextField name="projectManagerName" label="Project manager" required />
      <TextField name="poNumber" label="Customer PO number" placeholder="Mobily issues it in the PO stage" />
      <TextField name="poValue" label="PO value (SAR, excl. VAT)" type="number" />
    </ActionForm>
  );
};
