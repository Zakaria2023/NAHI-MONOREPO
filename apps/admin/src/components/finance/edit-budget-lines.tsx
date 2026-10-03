import { getBudget } from "services";
import { Card } from "ui";
import { budgetCategories } from "@/db/enum";
import { saveBudgetLinesAction } from "@/app/(dashboard)/finance/budgets/[projectUuid]/lines/actions";
import { PageHeader } from "@/components/shared/page-header";
import { BudgetLinesForm } from "./budget-lines-form";

type EditBudgetLinesProps = {
  projectUuid: string;
};

/** The planned lines of a project's budget, on a page of their own. */
export const EditBudgetLines = async ({ projectUuid }: EditBudgetLinesProps) => {
  const { project, budget } = await getBudget(projectUuid);
  const approved = budget?.status === "approved";
  const lines = budget && budget.lines.length > 0 ? budget.lines : budgetCategories.map((category) => ({ category, planned: 0 }));
  return (
    <>
      <PageHeader
        title={`${project.code} — planned lines`}
        description={project.name}
        back={{ href: `/finance/budgets/${project.uuid}`, label: `${project.code} budget` }}
      />
      <Card
        title="Planned lines"
        description={
          approved
            ? "The budget is approved: only the projects manager or the finance manager may change it, and each change is logged with its reason."
            : "Lines at zero are dropped when saved. Approval locks the budget against free edits."
        }
      >
        <BudgetLinesForm action={saveBudgetLinesAction.bind(null, project.uuid)} lines={lines} approved={approved} />
      </Card>
    </>
  );
};
