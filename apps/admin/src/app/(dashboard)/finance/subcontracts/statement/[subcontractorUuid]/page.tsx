import { SubcontractorStatement } from "@/components/finance/subcontractor-statement";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ subcontractorUuid: string }>;
};

const SubcontractorStatementPage = async ({ params }: Props) => {
  const { subcontractorUuid } = await params;
  return (
    <AsyncSection reloadKey={subcontractorUuid}>
      <SubcontractorStatement subcontractorUuid={subcontractorUuid} />
    </AsyncSection>
  );
};

export default SubcontractorStatementPage;
