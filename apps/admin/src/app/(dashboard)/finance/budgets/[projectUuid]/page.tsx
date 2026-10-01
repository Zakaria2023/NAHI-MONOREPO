import { BudgetDetail } from "@/components/finance/budget-detail";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ projectUuid: string }>;
};

const BudgetPage = async ({ params }: Props) => {
  const { projectUuid } = await params;
  return (
    <AsyncSection reloadKey={projectUuid}>
      <BudgetDetail projectUuid={projectUuid} />
    </AsyncSection>
  );
};

export default BudgetPage;
