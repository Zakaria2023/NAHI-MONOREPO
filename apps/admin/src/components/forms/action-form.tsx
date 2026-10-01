"use client";

import { ReactNode } from "react";
import { FieldValues, FormProvider, UseFormReturn } from "react-hook-form";
import { Button, FormError } from "ui";
import { ActionResult } from "@/lib/action-result";

type ActionFormProps<TIn extends FieldValues, TOut extends FieldValues> = {
  form: UseFormReturn<TIn, unknown, TOut>;
  onSubmit: () => void;
  state: ActionResult;
  isPending: boolean;
  submitLabel: string;
  children: ReactNode;
  /** Grid columns for the fields on wide screens. */
  columns?: 1 | 2 | 3;
  /** "inline" puts the fields and the button on one row — a step's date and Record. */
  layout?: "stack" | "inline";
  submitVariant?: "primary" | "outline" | "success";
};

const COLUMN_CLASSES = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
};

export const ActionForm = <TIn extends FieldValues, TOut extends FieldValues>({
  form,
  onSubmit,
  state,
  isPending,
  submitLabel,
  children,
  columns = 1,
  layout = "stack",
  submitVariant = "primary",
}: ActionFormProps<TIn, TOut>) => (
  <FormProvider {...form}>
    {layout === "inline" ? (
      <form onSubmit={onSubmit} className="flex flex-col gap-1.5" noValidate>
        <div className="flex flex-wrap items-end gap-2">
          {children}
          <Button type="submit" size="sm" variant={submitVariant} disabled={isPending} className="mb-0.5 h-9">
            {isPending ? "Saving…" : submitLabel}
          </Button>
        </div>
        <FormError message={state.error} />
      </form>
    ) : (
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
    )}
  </FormProvider>
);
