import { SuppliersBoard } from "@/components/procurement/suppliers-board";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const SuppliersPage = () => (
  <>
    <PageHeader
      title="Suppliers"
      description="The suppliers quotations are requested from, their registration, contacts and the rating from their evaluated POs."
      action={{ href: "#register-supplier", label: "Register supplier" }}
    />
    <AsyncSection reloadKey="suppliers">
      <SuppliersBoard />
    </AsyncSection>
  </>
);

export default SuppliersPage;
