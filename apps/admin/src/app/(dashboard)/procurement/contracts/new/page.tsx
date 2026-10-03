import { NewContract } from "@/components/procurement/new-contract";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const NewContractPage = () => (
  <>
    <PageHeader
      title="Sign a contract"
      description="Procurement — one agreed price per item, with the delivery, payment and penalty terms every call-off PO inherits."
      back={{ href: "/procurement/contracts", label: "Annual contracts" }}
    />
    <AsyncSection reloadKey="new-contract">
      <NewContract />
    </AsyncSection>
  </>
);

export default NewContractPage;
