import { listSuppliers } from "services";
import { Card } from "ui";
import { SupplierForm } from "./supplier-form";
import { SuppliersTable } from "./suppliers-table";

/** The register beside the form; a new supplier remounts the form empty. */
export const SuppliersBoard = async () => {
  const suppliers = await listSuppliers();
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <SuppliersTable suppliers={suppliers} />
      </div>
      <div id="register-supplier" className="scroll-mt-6">
        <Card title="Register supplier" description="A second supplier with the same name or VAT number is refused">
          <SupplierForm key={suppliers.length} />
        </Card>
      </div>
    </div>
  );
};
