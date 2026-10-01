import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";
import { NewStocktake } from "@/components/warehouse/new-stocktake";

const NewStocktakePage = () => (
  <>
    <PageHeader
      title="New stocktake"
      description="Count a warehouse, compare actual with book, and settle the differences with management approval."
      back={{ href: "/warehouse/documents?kind=stocktake", label: "Warehouse documents" }}
    />
    <AsyncSection reloadKey="new-stocktake">
      <NewStocktake />
    </AsyncSection>
  </>
);

export default NewStocktakePage;
