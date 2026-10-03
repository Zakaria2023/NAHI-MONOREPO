import { SignInScreen } from "@/components/auth/sign-in-screen";
import { AsyncSection } from "@/components/shared/async-section";

const SignInPage = () => (
  <main className="flex min-h-screen items-center justify-center bg-sidebar px-4 py-10">
    <AsyncSection reloadKey="sign-in">
      <SignInScreen />
    </AsyncSection>
  </main>
);

export default SignInPage;
