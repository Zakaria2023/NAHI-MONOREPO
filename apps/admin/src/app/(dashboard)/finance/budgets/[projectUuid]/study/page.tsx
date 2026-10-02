import { BudgetStudy } from "@/components/costs/budget-study";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ projectUuid: string }>;
};

const BudgetStudyPage = async ({ params }: Props) => {
  const { projectUuid } = await params;
  return (
    <AsyncSection reloadKey={projectUuid}>
      <BudgetStudy projectUuid={projectUuid} />
    </AsyncSection>
  );
};

export default BudgetStudyPage;
