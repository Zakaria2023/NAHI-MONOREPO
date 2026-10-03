import { NewAsset } from "@/components/assets/new-asset";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const NewAssetPage = () => (
  <>
    <PageHeader
      title="Register an asset"
      description="The asset card is created when the asset is received; depreciation starts the month it was bought."
      back={{ href: "/finance/assets", label: "Fixed assets" }}
    />
    <AsyncSection reloadKey="new-asset">
      <NewAsset />
    </AsyncSection>
  </>
);

export default NewAssetPage;
