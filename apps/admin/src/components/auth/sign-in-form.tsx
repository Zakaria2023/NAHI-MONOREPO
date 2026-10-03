"use client";

import { LogIn } from "lucide-react";
import { initialsOf } from "utils";
import { useSignInForm } from "@/app/sign-in/use-sign-in-form";
import { ActionForm } from "@/components/forms/action-form";
import { TextField } from "@/components/forms/text-field";

type DemoAccount = {
  email: string;
  name: string;
  roleLabel: string;
  employee: boolean;
};

type SignInFormProps = {
  accounts: DemoAccount[];
  demoPassword: string;
};

/** E-mail and password; below it, every demo account — click one to fill the form with it. */
export const SignInForm = ({ accounts, demoPassword }: SignInFormProps) => {
  const { form, state, isPending, onSubmit, fill } = useSignInForm();
  return (
    <div className="flex flex-col gap-8">
      <ActionForm form={form} onSubmit={onSubmit} state={state} isPending={isPending} submitLabel="Sign in">
        <TextField name="email" label="E-mail" type="email" placeholder="you@example.sa" required />
        <TextField name="password" label="Password" type="password" required />
      </ActionForm>
      <div className="flex flex-col gap-3 border-t border-hairline pt-6">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">Demo accounts</span>
          <span className="text-xs text-muted">
            The demo accounts all use the password <span className="font-medium text-ink">{demoPassword}</span>. Pick one to fill the form.
          </span>
        </div>
        {[true, false].map((employee) => (
          <div key={String(employee)} className="flex flex-col gap-1.5">
            <span className="text-xs text-faint">{employee ? "Employees" : "Managers & staff"}</span>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {accounts
                .filter((a) => a.employee === employee)
                .map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => fill(a.email, demoPassword)}
                    className="group flex items-center gap-2.5 rounded-control border border-hairline px-2.5 py-2 text-start transition-colors hover:border-primary hover:bg-primary-tint"
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${employee ? "bg-teal-tint text-teal" : "bg-primary-tint text-primary"}`}>
                      {initialsOf(a.name)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="line-clamp-1 text-xs font-medium text-ink">{a.name}</span>
                      <span className="line-clamp-1 text-xs text-muted">{a.roleLabel}</span>
                    </span>
                    <LogIn size={14} className="text-faint group-hover:text-primary" />
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
