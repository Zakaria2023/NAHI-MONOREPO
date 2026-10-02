import { AssetView } from "@/components/assets/asset-view";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const AssetPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <AssetView uuid={uuid} />
    </AsyncSection>
  );
};

export default AssetPage;
