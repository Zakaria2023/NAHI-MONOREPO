import { PurchaseOrderView } from "@/components/procurement/purchase-order-view";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PurchaseOrderPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <PurchaseOrderView uuid={uuid} />
    </AsyncSection>
  );
};

export default PurchaseOrderPage;
