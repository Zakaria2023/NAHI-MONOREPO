import { Card } from "ui";
import { PageHeader } from "@/components/shared/page-header";
import { BankAccountForm } from "@/components/treasury/bank-account-form";

const NewBankAccountPage = () => (
  <>
    <PageHeader
      title="New bank account"
      description="The opening balance on the opening date; every payment and collection after it moves the balance. The first account added is the primary one."
      back={{ href: "/finance/bank", label: "Bank accounts" }}
    />
    <Card title="Bank account">
      <BankAccountForm />
    </Card>
  </>
);

export default NewBankAccountPage;
