import { ReturnsBoard } from "@/components/procurement/returns-board";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const ReturnsPage = () => (
  <>
    <PageHeader
      title="Returns & debit notes"
      description="Goods sent back to suppliers — rejected at the receiving check, or found faulty in stock — against a replacement or a debit note set off against the supplier's next invoice."
    />
    <AsyncSection reloadKey="returns">
      <ReturnsBoard />
    </AsyncSection>
  </>
);

export default ReturnsPage;
