import { EditBudgetLines } from "@/components/finance/edit-budget-lines";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ projectUuid: string }>;
};

const BudgetLinesPage = async ({ params }: Props) => {
  const { projectUuid } = await params;
  return (
    <AsyncSection reloadKey={`budget-lines-${projectUuid}`}>
      <EditBudgetLines projectUuid={projectUuid} />
    </AsyncSection>
  );
};

export default BudgetLinesPage;
