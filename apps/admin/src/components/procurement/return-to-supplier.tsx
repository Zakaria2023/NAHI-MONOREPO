import { getPurchaseOrder, listWarehouses } from "services";
import { Card } from "ui";
import { returnToSupplierAction } from "@/app/(dashboard)/procurement/orders/[uuid]/return/actions";
import { PageHeader } from "@/components/shared/page-header";
import { BlockedNote } from "@/components/warehouse/blocked-note";
import { SupplierReturnForm } from "./supplier-return-form";

type ReturnToSupplierProps = {
  uuid: string;
};

/** Other cases — goods found faulty in stock go back to the supplier, against a debit note or a replacement. */
export const ReturnToSupplier = async ({ uuid }: ReturnToSupplierProps) => {
  const [detail, warehouses] = await Promise.all([getPurchaseOrder(uuid), listWarehouses()]);
  const { po, supplier } = detail;
  const returnable = po.status === "partially_received" || po.status === "received";
  return (
    <>
      <PageHeader
        title={`Return goods — ${po.number}`}
        description={`Back to ${supplier.name} from stock, for a debit note off their next invoice or a replacement.`}
        back={{ href: `/procurement/orders/${po.uuid}`, label: po.number }}
      />
      {returnable ? (
        <Card title="Return to the supplier">
          <SupplierReturnForm
            action={returnToSupplierAction.bind(null, po.uuid)}
            warehouses={warehouses.map((w) => ({ value: w.uuid, label: `${w.code} — ${w.name}` }))}
            items={detail.lines.map((l) => ({ value: l.itemUuid, label: `${l.item.code} — ${l.item.name}` }))}
          />
        </Card>
      ) : (
        <BlockedNote reason="Only goods already received on this PO can be returned." />
      )}
    </>
  );
};
