import { AsyncSection } from "@/components/shared/async-section";
import { ItemCardView } from "@/components/warehouse/item-card-view";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ItemPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <ItemCardView uuid={uuid} />
    </AsyncSection>
  );
};

export default ItemPage;
