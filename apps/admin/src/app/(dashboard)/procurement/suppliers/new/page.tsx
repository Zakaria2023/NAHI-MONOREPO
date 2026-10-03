import { Card } from "ui";
import { PageHeader } from "@/components/shared/page-header";
import { SupplierForm } from "@/components/procurement/supplier-form";

const NewSupplierPage = () => (
  <>
    <PageHeader
      title="Register supplier"
      description="Its registration and contacts. Quotation requests and POs are e-mailed to the address given here."
      back={{ href: "/procurement/suppliers", label: "Suppliers" }}
    />
    <Card title="Supplier" description="A second supplier with the same name or VAT number is refused">
      <SupplierForm />
    </Card>
  </>
);

export default NewSupplierPage;
