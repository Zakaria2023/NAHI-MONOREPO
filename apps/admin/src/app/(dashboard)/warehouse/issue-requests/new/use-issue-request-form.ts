"use client";

import { useWatch } from "react-hook-form";
import { issueRequestSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { createIssueRequestAction } from "./actions";

/** The subcontractor picker shows only when the stock is charged to a subcontractor. */
export const useIssueRequestForm = () => {
  const { form, state, isPending, onSubmit } = useActionForm(issueRequestSchema, createIssueRequestAction, {
    projectUuid: "",
    warehouseUuid: "",
    recipientKind: "employee",
    recipientName: "",
    lines: [{ itemUuid: "", qty: 1 }],
  });
  const recipientKind = useWatch({ control: form.control, name: "recipientKind" });
  return { form, state, isPending, onSubmit, recipientKind };
};
