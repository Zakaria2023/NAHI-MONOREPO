import { BudgetStudyView } from "services";
import { Table } from "ui";
import { formatMoney, formatNumber } from "utils";
import { BUDGET_CATEGORY_LABELS, EQUIPMENT_SUPPLY_TYPE_LABELS, WORK_TYPE_LABELS } from "@/db/label";
import { removeStudyLineAction } from "@/app/(dashboard)/finance/budgets/[projectUuid]/study/actions";
import { ActionButton } from "@/components/shared/action-button";

type StudyLinesTableProps = {
  projectUuid: string;
  lines: BudgetStudyView["lines"];
};

export const StudyLinesTable = ({ projectUuid, lines }: StudyLinesTableProps) => (
  <Table
    data={lines}
    rowKey={(l) => l.uuid}
    pageSize={25}
    emptyMessage="The study has no lines yet."
    columns={[
      { key: "category", header: "Category", render: (l) => <span className="text-secondary">{BUDGET_CATEGORY_LABELS[l.category]}</span> },
      {
        key: "description",
        header: "Line",
        render: (l) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{l.description}</span>
            {(l.supplyType || l.workType) && (
              <span className="text-xs text-muted">
                {[l.supplyType && EQUIPMENT_SUPPLY_TYPE_LABELS[l.supplyType], l.workType && WORK_TYPE_LABELS[l.workType]].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>
        ),
      },
      { key: "qty", header: "Qty", align: "end", render: (l) => `${formatNumber(l.qty)} ${l.unit}` },
      { key: "cost", header: "Unit cost", align: "end", render: (l) => formatMoney(l.unitCost) },
      { key: "duration", header: "Duration", align: "end", render: (l) => l.duration ?? "—" },
      { key: "amount", header: "Amount", align: "end", render: (l) => <span className="font-medium">{formatMoney(l.amount)}</span> },
      {
        key: "remove",
        header: "",
        render: (l) => (
          <div className="relative z-10 print:hidden">
            <ActionButton action={removeStudyLineAction.bind(null, projectUuid, l.uuid)} label="Remove" size="sm" variant="outline" />
          </div>
        ),
      },
    ]}
  />
);
