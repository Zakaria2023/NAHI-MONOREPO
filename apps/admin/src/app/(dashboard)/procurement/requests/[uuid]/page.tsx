import { PurchaseRequestView } from "@/components/procurement/purchase-request-view";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PurchaseRequestPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <PurchaseRequestView uuid={uuid} />
    </AsyncSection>
  );
};

export default PurchaseRequestPage;
