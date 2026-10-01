import { SupplierInvoiceFormSection } from "@/components/finance/supplier-invoice-form-section";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const NewSupplierInvoicePage = () => (
  <>
    <PageHeader
      title="Register supplier invoice"
      description="Registering matches the invoice against the PO and the goods received, recovers any advance, and sets the due date from the PO's payment terms."
      back={{ href: "/finance/payables", label: "Supplier invoices" }}
    />
    <AsyncSection reloadKey="new-supplier-invoice">
      <SupplierInvoiceFormSection />
    </AsyncSection>
  </>
);

export default NewSupplierInvoicePage;
