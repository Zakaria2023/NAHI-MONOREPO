import Link from "next/link";
import { SubcontractRow } from "services";
import { Table } from "ui";
import { formatMoney } from "utils";
import { BUDGET_CATEGORY_LABELS } from "@/db/label";
import { ProgressBar } from "@/components/shared/progress-bar";

type SubcontractsTableProps = {
  subcontracts: SubcontractRow[];
  /** Off on the subcontractor's own statement, where the name is the page. */
  linkSubcontractor?: boolean;
  emptyMessage?: string;
};

export const SubcontractsTable = ({
  subcontracts,
  linkSubcontractor = true,
  emptyMessage = "No subcontract yet. Create one below to start taking extracts against it.",
}: SubcontractsTableProps) => (
  <Table
    data={subcontracts}
    rowKey={(s) => s.uuid}
    emptyMessage={emptyMessage}
    columns={[
      {
        key: "number",
        header: "Subcontract", wrap: true,
        render: (s) => (
          <div className="flex flex-col gap-0.5">
            <span dir="ltr" className="font-medium">
              {s.number}
            </span>
            <span className="line-clamp-2 max-w-56 text-xs text-muted">{s.scope}</span>
          </div>
        ),
      },
      {
        key: "subcontractor",
        header: "Subcontractor",
        render: (s) =>
          linkSubcontractor ? (
            <Link href={`/finance/subcontracts/statement/${s.subcontractorUuid}`} className="after:absolute after:inset-0 hover:text-primary">
              {s.subcontractorName}
            </Link>
          ) : (
            s.subcontractorName
          ),
      },
      {
        key: "project",
        header: "Project",
        render: (s) => (
          <div className="flex flex-col gap-0.5">
            <span dir="ltr">{s.projectCode}</span>
            <span className="text-xs text-muted">{BUDGET_CATEGORY_LABELS[s.budgetCategory]}</span>
          </div>
        ),
      },
      { key: "value", header: "Value", align: "end", render: (s) => formatMoney(s.value) },
      { key: "retentionPct", header: "Retention", align: "end", render: (s) => `${s.retentionPct}%` },
      {
        key: "certified",
        header: "Certified",
        align: "end",
        render: (s) => (
          <div className="flex w-36 flex-col items-end gap-1.5 ms-auto">
            <span>{formatMoney(s.certified)}</span>
            <ProgressBar value={s.value > 0 ? s.certified / s.value : 0} />
          </div>
        ),
      },
      { key: "retentionHeld", header: "Retention held", align: "end", render: (s) => formatMoney(s.retentionHeld) },
      {
        key: "advance",
        header: "Advance paid / recovered",
        align: "end",
        render: (s) => (
          <div className="flex flex-col items-end gap-0.5">
            <span>{formatMoney(s.advancePaid)}</span>
            <span className="text-xs text-muted">{formatMoney(s.advanceRecovered)} recovered</span>
          </div>
        ),
      },
      {
        key: "materials",
        header: "Materials to deduct",
        align: "end",
        render: (s) => (s.materialsPending > 0 ? <span className="text-warning">{formatMoney(s.materialsPending)}</span> : <span className="text-muted">—</span>),
      },
    ]}
  />
);
