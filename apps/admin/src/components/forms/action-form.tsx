"use client";

import { ReactNode } from "react";
import { FieldValues, FormProvider, UseFormReturn } from "react-hook-form";
import { Button, FormError } from "ui";
import { ActionResult } from "@/lib/action-result";
import { useCloseOnSuccess } from "@/lib/use-close-on-success";

type ActionFormProps<TIn extends FieldValues, TOut extends FieldValues> = {
  form: UseFormReturn<TIn, unknown, TOut>;
  onSubmit: () => void;
  state: ActionResult;
  isPending: boolean;
  submitLabel: string;
  children: ReactNode;
  /** Grid columns for the fields on wide screens. */
  columns?: 1 | 2 | 3;
  submitVariant?: "primary" | "outline" | "success";
};

const COLUMN_CLASSES = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
};

/**
 * Every form in the admin: on its own page, or in a dialog — where it closes
 * the dialog once its action succeeds, so the form itself needs no wiring.
 */
export const ActionForm = <TIn extends FieldValues, TOut extends FieldValues>({
  form,
  onSubmit,
  state,
  isPending,
  submitLabel,
  children,
  columns = 1,
  submitVariant = "primary",
}: ActionFormProps<TIn, TOut>) => {
  useCloseOnSuccess(state);
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className={`grid gap-4 ${COLUMN_CLASSES[columns]}`}>{children}</div>
        <FormError message={state.error} />
        {state.success && !state.error && <p className="text-sm text-success">{state.success}</p>}
        <div>
          <Button type="submit" variant={submitVariant} disabled={isPending}>
            {isPending ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};
