"use client";

import { signInSchema } from "validators";
import { useActionForm } from "@/lib/use-action-form";
import { signInAction } from "./actions";

/** The sign-in form; `fill` puts a demo account's e-mail and password in it. */
export const useSignInForm = () => {
  const { form, state, isPending, onSubmit } = useActionForm(signInSchema, signInAction, { email: "", password: "" });
  const fill = (email: string, password: string) => {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", password, { shouldValidate: true });
  };
  return { form, state, isPending, onSubmit, fill };
};
