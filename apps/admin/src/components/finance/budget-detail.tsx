import { getBudget } from "services";
import { Card, StatStrip, StatTile } from "ui";
import { formatMoney, formatPercent, round2 } from "utils";
import { budgetCategories } from "@/db/enum";
import { approveBudgetAction, saveBudgetLinesAction } from "@/app/(dashboard)/finance/budgets/[projectUuid]/actions";
import { ActionButton } from "@/components/shared/action-button";
import { OperatorPill } from "@/components/shared/operator-pill";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentStaff } from "@/lib/server/auth";
import { BudgetLinesForm } from "./budget-lines-form";
import { BudgetRevisions } from "./budget-revisions";
import { BudgetStatusPill } from "./budget-status-pill";
import { BudgetUsageTable } from "./budget-usage-table";
import { DoneNote } from "./done-note";

type BudgetDetailProps = {
  projectUuid: string;
};

export const BudgetDetail = async ({ projectUuid }: BudgetDetailProps) => {
  const [{ project, budget, usage, totals }, actor] = await Promise.all([getBudget(projectUuid), getCurrentStaff()]);
  const approved = budget?.status === "approved";
  const consumed = round2(totals.planned - totals.remaining);
  const margin = round2(project.poValue - totals.planned);
  const approveBlocker = !budget
    ? "Save the planned lines first."
    : budget.lines.length === 0
      ? "Plan at least one budget line first."
      : actor.role !== "projects_manager"
        ? "Only the Projects manager approves a budget — switch user at the foot of the sidebar."
        : null;
  const lines = budget && budget.lines.length > 0 ? budget.lines : budgetCategories.map((category) => ({ category, planned: 0 }));
  return (
    <>
      <PageHeader
        title={`${project.code} budget`}
        description={project.name}
        back={{ href: "/finance/budgets", label: "Project budgets" }}
        meta={
          <>
            <OperatorPill operator={project.operator} />
            <BudgetStatusPill budget={budget} />
          </>
        }
      />
      <StatStrip columns="sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Planned" value={formatMoney(totals.planned)} hint={`${budget?.lines.length ?? 0} study line(s)`} />
        <StatTile
          label="Consumed"
          value={formatMoney(consumed)}
          hint={totals.planned > 0 ? `${formatPercent(consumed / totals.planned)} of plan — reserved, committed and spent` : "Nothing planned yet"}
        />
        <StatTile label="Remaining" value={<span className={totals.remaining < 0 ? "text-danger" : ""}>{formatMoney(totals.remaining)}</span>} hint={totals.remaining < 0 ? "Over budget" : "Left to charge"} />
        <StatTile label="Planned margin" value={formatMoney(margin)} hint={`Customer PO ${formatMoney(project.poValue)} less planned cost`} />
      </StatStrip>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card title="Budget vs actual" description="Reserved by approved requests, committed on POs (net of VAT), spent through custody, extracts and stock. Actual cost adds supplier invoices.">
            <BudgetUsageTable usage={usage} totals={totals} />
          </Card>
          <Card
            title="Planned lines"
            description={
              approved
                ? "The budget is approved: only the projects manager or the finance manager may change it, and each change is logged with its reason."
                : "Lines at zero are dropped when saved. Approval locks the budget against free edits."
            }
          >
            <BudgetLinesForm key={budget?.revisions.length ?? 0} action={saveBudgetLinesAction.bind(null, project.uuid)} lines={lines} approved={approved} />
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card title="Approval" description="Approved by the projects manager before execution; nothing is charged to the project until then.">
            {approved ? (
              <DoneNote label="Approved" by={budget.approvedBy} at={budget.approvedAt} />
            ) : (
              <ActionButton action={approveBudgetAction.bind(null, project.uuid)} label="Approve budget" variant="success" blocker={approveBlocker} />
            )}
          </Card>
          <Card title="Revisions" description="Changes made to the approved budget.">
            <BudgetRevisions revisions={budget?.revisions ?? []} />
          </Card>
        </div>
      </div>
    </>
  );
};
