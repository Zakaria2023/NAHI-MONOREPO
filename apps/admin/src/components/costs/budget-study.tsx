import { getBudgetStudy } from "services";
import { Card, StatStrip, StatTile } from "ui";
import { formatMoney, formatPercent, round2, sumBy } from "utils";
import {
  addScheduleItemAction,
  addStudyLineAction,
  applyStudyAction,
} from "@/app/(dashboard)/finance/budgets/[projectUuid]/study/actions";
import { CsvButton } from "@/components/shared/csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { ApplyStudyForm } from "./apply-study-form";
import { ScheduleItemForm } from "./schedule-item-form";
import { StudyLineForm } from "./study-line-form";
import { StudyLinesTable } from "./study-lines-table";
import { StudyTimeline } from "./study-timeline";
import { VarianceTable } from "./variance-table";

type BudgetStudyProps = {
  projectUuid: string;
};

/** Finance §4, the study: its lines, its timelines, and the variance of actual cost against it. */
export const BudgetStudy = async ({ projectUuid }: BudgetStudyProps) => {
  const study = await getBudgetStudy(projectUuid);
  const { project } = study;
  const actual = round2(sumBy(study.categories, (c) => c.actual));
  const variance = round2(study.studyTotal - actual);
  return (
    <>
      <PageHeader
        title={`${project.code} — budget study`}
        description={`${project.name}. The detailed estimate behind the budget, the timelines for materials, manpower and equipment, and how actual cost compares.`}
        back={{ href: `/finance/budgets/${project.uuid}`, label: `${project.code} budget` }}
      />
      <StatStrip columns="sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Study total" value={formatMoney(study.studyTotal)} hint={`${study.lines.length} line(s)`} />
        <StatTile
          label="Planned margin"
          value={formatMoney(round2(project.poValue - study.studyTotal))}
          hint={`Customer PO ${formatMoney(project.poValue)}`}
        />
        <StatTile label="Actual cost to date" value={formatMoney(actual)} hint={study.studyTotal > 0 ? `${formatPercent(actual / study.studyTotal)} of the study` : "—"} />
        <StatTile
          label="Variance"
          value={<span className={variance < 0 ? "text-danger" : ""}>{formatMoney(variance)}</span>}
          hint={variance < 0 ? "Over the study" : "Still within the study"}
        />
      </StatStrip>
      <Card
        title="Variance by category"
        description="The study against actual cost (supplier invoices, custody, extracts, stock, payroll, expenses, overhead), and what is still committed on POs"
        action={
          <div className="flex flex-wrap gap-2">
            <CsvButton
              filename={`${project.code}-variance`}
              rows={[
                ["Category", "Study", "Budget", "Actual", "Variance", "Committed"],
                ...study.categories.map((c) => [c.category, c.study, c.budgeted, c.actual, c.variance, c.committed]),
              ]}
            />
            <PrintButton />
          </div>
        }
      >
        <VarianceTable categories={study.categories} />
      </Card>
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card
            title="Study lines"
            description="Quantities and costs — equipment with how it is supplied, manpower by job title and headcount"
            action={
              <CsvButton
                filename={`${project.code}-budget-study`}
                rows={[
                  ["Category", "Description", "Unit", "Qty", "Unit cost", "Duration", "Supply", "Work", "Amount"],
                  ...study.lines.map((l) => [l.category, l.description, l.unit, l.qty, l.unitCost, l.duration ?? "", l.supplyType ?? "", l.workType ?? "", l.amount]),
                ]}
              />
            }
          >
            <StudyLinesTable projectUuid={project.uuid} lines={study.lines} />
          </Card>
          <Card title="Timelines" description="When materials, manpower and equipment are needed on site">
            <StudyTimeline projectUuid={project.uuid} items={study.schedule} />
          </Card>
        </div>
        <div className="flex flex-col gap-6 print:hidden">
          <Card
            title="Apply to the budget"
            description={
              study.differsFromBudget
                ? "The study's category totals differ from the budget's planned lines"
                : "The budget's planned lines already match the study"
            }
          >
            <ApplyStudyForm action={applyStudyAction.bind(null, project.uuid)} approved={study.status === "approved"} disabled={!study.differsFromBudget} />
          </Card>
          <Card title="Add a study line">
            <StudyLineForm key={study.lines.length} action={addStudyLineAction.bind(null, project.uuid)} />
          </Card>
          <Card title="Add a timeline row">
            <ScheduleItemForm key={study.schedule.length} action={addScheduleItemAction.bind(null, project.uuid)} />
          </Card>
        </div>
      </div>
    </>
  );
};
