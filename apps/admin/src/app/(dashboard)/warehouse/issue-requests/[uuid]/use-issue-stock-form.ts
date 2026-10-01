"use client";

import { issueStockSchema } from "validators";
import { FormAction } from "@/lib/action-result";
import { useActionForm } from "@/lib/use-action-form";

export const useIssueStockForm = (action: FormAction, recipientName: string) =>
  useActionForm(issueStockSchema, action, { signedByRecipient: recipientName });
