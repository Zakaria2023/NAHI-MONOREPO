import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";
import { NewGuarantee } from "@/components/treasury/new-guarantee";

const NewGuaranteePage = () => (
  <>
    <PageHeader
      title="New letter of guarantee"
      description="Its bank, kind, beneficiary and amount, and when it expires — an alert comes before it does."
      back={{ href: "/finance/guarantees", label: "Guarantees & retentions" }}
    />
    <AsyncSection reloadKey="new-guarantee">
      <NewGuarantee />
    </AsyncSection>
  </>
);

export default NewGuaranteePage;
