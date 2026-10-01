"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { DefaultValues, FieldValues, useForm } from "react-hook-form";
import { ZodType } from "zod";
import { ActionResult } from "@/lib/action-result";

/**
 * Every form in the admin is the same wiring — `useActionState` for the server
 * round trip, `react-hook-form` + `zodResolver` for the client check, and
 * `dispatch` inside `handleSubmit` — so it is written once. Returns the form
 * whole, plus what the markup branches on.
 */
export const useActionForm = <TIn extends FieldValues, TOut extends FieldValues>(
  schema: ZodType<TOut, TIn>,
  action: (prev: ActionResult, data: TOut) => Promise<ActionResult>,
  defaultValues: DefaultValues<TIn>,
) => {
  const [state, dispatch, isPending] = useActionState(action, {});
  const form = useForm<TIn, unknown, TOut>({ resolver: zodResolver(schema), defaultValues });
  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => dispatch(values));
  });
  return { form, state, isPending, onSubmit };
};
