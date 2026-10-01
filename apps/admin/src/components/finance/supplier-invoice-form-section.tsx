import { listInvoiceableReceipts, listSuppliers } from "services";
import { Card } from "ui";
import { SupplierInvoiceForm } from "./supplier-invoice-form";

export const SupplierInvoiceFormSection = async () => {
  const [suppliers, invoiceable] = await Promise.all([listSuppliers(), listInvoiceableReceipts()]);
  const orders = invoiceable.map(({ po, receipts }) => ({
    uuid: po.uuid,
    number: po.number,
    supplierUuid: po.supplierUuid,
    advancePaid: po.advancePaid,
    receipts,
  }));
  const supplierOptions = suppliers.map((s) => {
    const open = orders.filter((o) => o.supplierUuid === s.uuid).length;
    return { value: s.uuid, label: s.name, hint: `VAT ${s.vatNumber || "missing"} · ${open} PO(s) to invoice` };
  });
  return (
    <Card
      title="Invoice details"
      description="Link the invoice to its PO and the receipts it bills. It is refused if the supplier's VAT or company details are missing, the number is a duplicate, the VAT is off, or the three-way match fails."
    >
      <SupplierInvoiceForm supplierOptions={supplierOptions} orders={orders} />
    </Card>
  );
};
