"use client";

import { taxFilingSchema } from "validators";
import { ObligationKind } from "@/db/enum";
import { useActionForm } from "@/lib/use-action-form";
import { fileObligationAction } from "./actions";

/** One row's form: the kind and month are fixed by the row, the reference is typed. */
export const useFilingForm = (kind: ObligationKind, period: string) =>
  useActionForm(taxFilingSchema, fileObligationAction, { kind, period, reference: "" });
