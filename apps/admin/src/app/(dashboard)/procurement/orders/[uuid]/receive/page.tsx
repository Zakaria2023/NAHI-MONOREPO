import { ReceiveGoods } from "@/components/procurement/receive-goods";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ReceiveGoodsPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <ReceiveGoods uuid={uuid} />
    </AsyncSection>
  );
};

export default ReceiveGoodsPage;
