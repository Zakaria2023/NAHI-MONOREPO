import { PurchaseOrderDetail } from "services";
import { Card } from "ui";
import { formatMoney, round2 } from "utils";
import { advancePaymentAction } from "@/app/(dashboard)/procurement/orders/[uuid]/actions";
import { FactList } from "@/components/shared/fact-list";
import { ProgressBar } from "@/components/shared/progress-bar";
import { AdvancePaymentForm } from "./advance-payment-form";
import { BlockedNote } from "./blocked-note";

type AdvanceCardProps = {
  detail: PurchaseOrderDetail;
};

/** An advance linked to the PO, recovered automatically from its supplier invoices. */
export const AdvanceCard = ({ detail }: AdvanceCardProps) => {
  const { po, advanceRecovered } = detail;
  const payable = po.status !== "pending_approval" && po.status !== "rejected" && po.status !== "cancelled";
  return (
    <Card title="Advance payment" description="Paid up front by finance and settled on the PO's invoices">
      <div className="flex flex-col gap-4">
        <FactList
          columns={3}
          facts={[
            { label: "Advance paid", value: formatMoney(po.advancePaid) },
            { label: "Recovered from invoices", value: formatMoney(advanceRecovered) },
            { label: "Still to recover", value: formatMoney(round2(po.advancePaid - advanceRecovered)) },
          ]}
        />
        {po.advancePaid > 0 && <ProgressBar value={advanceRecovered / po.advancePaid} />}
        {payable ? (
          <AdvancePaymentForm key={po.advancePaid} action={advancePaymentAction.bind(null, po.uuid)} />
        ) : (
          <BlockedNote>Advances are paid on an approved PO, up to its total of {formatMoney(po.total)}.</BlockedNote>
        )}
      </div>
    </Card>
  );
};
