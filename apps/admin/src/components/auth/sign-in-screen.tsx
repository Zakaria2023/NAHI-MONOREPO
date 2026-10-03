import { DEMO_PASSWORD, listStaff } from "services";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { BRAND_ICON } from "@/lib/nav";
import { SignInForm } from "./sign-in-form";

/** The sign-in card on the grey frame, with the demo accounts to try. */
export const SignInScreen = async () => {
  const staff = await listStaff();
  return (
    <div className="flex w-full max-w-xl flex-col gap-6 rounded-card border border-hairline bg-surface p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-control bg-primary text-white">{BRAND_ICON}</span>
        <div className="flex flex-col">
          <h1 className="text-xl font-medium tracking-tight text-ink">Sign in to NAHI</h1>
          <p className="text-sm text-muted">Mobily · STC operations</p>
        </div>
      </div>
      <SignInForm
        demoPassword={DEMO_PASSWORD}
        accounts={staff.map((u) => ({ email: u.email, name: u.name, roleLabel: STAFF_ROLE_LABELS[u.role], employee: u.role === "employee" }))}
      />
    </div>
  );
};
