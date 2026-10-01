import { AsyncSection } from "@/components/shared/async-section";
import { StocktakeView } from "@/components/warehouse/stocktake-view";

type Props = {
  params: Promise<{ uuid: string }>;
};

const StocktakePage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <StocktakeView uuid={uuid} />
    </AsyncSection>
  );
};

export default StocktakePage;
