import { CalendarPlus, ListPlus, Scale } from "lucide-react";
import { getBudgetStudy } from "services";
import { Card, StatStrip, StatTile } from "ui";
import { formatMoney, formatPercent, round2, sumBy } from "utils";
import { addScheduleItemAction, applyStudyAction } from "@/app/(dashboard)/finance/budgets/[projectUuid]/study/actions";
import { CsvButton } from "@/components/shared/csv-button";
import { FormDialog } from "@/components/shared/form-dialog";
import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { ApplyStudyForm } from "./apply-study-form";
import { ScheduleItemForm } from "./schedule-item-form";
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
          <Card title="Build the study" description="Lines, the timelines, then the totals into the budget">
            <div className="flex flex-col gap-3">
              <LinkButton href={`/finance/budgets/${project.uuid}/study/lines/new`} label="Add a study line" icon={<ListPlus size={16} />} />
              <FormDialog label="Add a timeline row" title="Add a timeline row" description="When a material, a crew or a piece of equipment is needed on site" icon={<CalendarPlus size={16} />}>
                <ScheduleItemForm action={addScheduleItemAction.bind(null, project.uuid)} />
              </FormDialog>
              <FormDialog
                label="Apply to the budget"
                title="Apply the study to the budget"
                description="The budget's planned lines become the study's category totals"
                icon={<Scale size={16} />}
                blocker={study.differsFromBudget ? null : "The budget's planned lines already match the study"}
              >
                <ApplyStudyForm action={applyStudyAction.bind(null, project.uuid)} approved={study.status === "approved"} />
              </FormDialog>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};
