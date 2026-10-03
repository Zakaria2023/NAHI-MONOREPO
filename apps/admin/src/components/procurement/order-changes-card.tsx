import { PencilLine } from "lucide-react";
import { PurchaseOrderDetail } from "services";
import { Card } from "ui";
import { LinkButton } from "@/components/shared/link-button";

type OrderChangesCardProps = {
  detail: PurchaseOrderDetail;
};

/** Other cases — modifying a PO: procurement changes it, and its approvers sign it again. */
export const OrderChangesCard = ({ detail }: OrderChangesCardProps) => {
  const { po } = detail;
  return (
    <Card
      title="Modify the PO"
      description="Procurement — quantities, prices or delivery. Any increase is checked against the budget, and the PO goes back through its approval chain."
    >
      <LinkButton href={`/procurement/orders/${po.uuid}/amend`} label="Modify the PO" icon={<PencilLine size={16} />} variant="outline" />
    </Card>
  );
};
