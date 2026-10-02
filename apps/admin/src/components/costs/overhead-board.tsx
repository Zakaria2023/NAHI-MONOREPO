import { previewOverhead } from "services";
import { Card, StatStrip, StatTile, StatusPill, Table } from "ui";
import { formatDate, formatMoney, formatPercent, formatPeriod } from "utils";
import { OVERHEAD_BASIS_LABELS } from "@/db/label";
import { OverheadBasis } from "@/db/enum";
import { postOverheadAction } from "@/app/(dashboard)/finance/overhead/actions";
import { ActionButton } from "@/components/shared/action-button";
import { CsvButton } from "@/components/shared/csv-button";

type OverheadBoardProps = {
  period: string;
  basis: OverheadBasis;
};

export const OverheadBoard = async ({ period, basis }: OverheadBoardProps) => {
  const view = await previewOverhead(period, basis);
  return (
    <>
      <StatStrip columns="sm:grid-cols-2 xl:grid-cols-4">
        <StatTile tone="primary" label="Overhead pool" value={formatMoney(view.pool)} hint={formatPeriod(period)} />
        <StatTile tone="violet" label="Head-office expenses" value={formatMoney(view.poolParts.expenses)} hint="Departments and vehicles" />
        <StatTile tone="teal" label="Head-office payroll" value={formatMoney(view.poolParts.payroll)} hint="From approved payroll runs" />
        <StatTile tone="warning" label="Head-office depreciation" value={formatMoney(view.poolParts.depreciation)} hint="Assets not charged to a project" />
      </StatStrip>
      <Card
        title={view.posted ? `Allocated — ${OVERHEAD_BASIS_LABELS[view.posted.basis].toLowerCase()}` : `Preview — ${OVERHEAD_BASIS_LABELS[basis].toLowerCase()}`}
        description={
          view.posted
            ? `Posted by ${view.posted.postedBy} on ${formatDate(view.posted.postedAt)}; each share counts against the project's overhead budget`
            : "Over the projects whose budget is approved. Posting books each share against the project's overhead budget — once per month."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CsvButton
              filename={`overhead-${period}`}
              rows={[["Project", "Name", "Basis value", "Share"], ...view.lines.map((l) => [l.projectCode, l.projectName, l.basisValue, l.amount])]}
            />
            {view.posted ? (
              <StatusPill tone="success">Posted</StatusPill>
            ) : (
              <ActionButton action={postOverheadAction.bind(null, period, basis)} label="Post allocation" size="sm" blocker={view.lines.length === 0 ? "Nothing to allocate" : null} />
            )}
          </div>
        }
      >
        <Table
          data={view.lines}
          rowKey={(l) => l.projectUuid}
          emptyMessage={view.pool <= 0 ? "No overhead this month." : "No project has anything on this basis."}
          columns={[
            {
              key: "project",
              header: "Project",
              render: (l) => (
                <div className="flex flex-col gap-0.5">
                  <span dir="ltr" className="font-medium">
                    {l.projectCode}
                  </span>
                  <span className="text-xs text-muted">{l.projectName}</span>
                </div>
              ),
            },
            {
              key: "basis",
              header: OVERHEAD_BASIS_LABELS[view.basis],
              align: "end",
              render: (l) => (view.basis === "equal" ? "1 share" : formatMoney(l.basisValue)),
            },
            { key: "pct", header: "Share", align: "end", render: (l) => (view.pool > 0 ? formatPercent(l.amount / view.pool) : "—") },
            { key: "amount", header: "Overhead charged", align: "end", render: (l) => <span className="font-medium">{formatMoney(l.amount)}</span> },
          ]}
        />
      </Card>
    </>
  );
};
