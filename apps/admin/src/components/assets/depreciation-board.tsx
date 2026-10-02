import Link from "next/link";
import { getDepreciationMonth } from "services";
import { Card, StatStrip, StatTile, StatusPill, Table } from "ui";
import { formatDate, formatMoney, formatPeriod } from "utils";
import { ASSET_CATEGORY_LABELS } from "@/db/label";
import { postDepreciationAction } from "@/app/(dashboard)/finance/depreciation/actions";
import { ActionButton } from "@/components/shared/action-button";
import { CsvButton } from "@/components/shared/csv-button";

type DepreciationBoardProps = {
  period: string;
};

export const DepreciationBoard = async ({ period }: DepreciationBoardProps) => {
  const month = await getDepreciationMonth(period);
  return (
    <>
      <StatStrip columns="sm:grid-cols-3">
        <StatTile tone="violet" label={`Depreciation ${formatPeriod(period)}`} value={formatMoney(month.total)} hint={`${month.lines.length} assets`} />
        <StatTile
          tone={month.posted ? "success" : "warning"}
          label="Posting"
          value={month.posted ? "Posted" : "Not posted"}
          hint={month.posted ? `${month.posted.postedBy} · ${formatDate(month.posted.postedAt)}` : "Post it before the month is closed"}
        />
        <StatTile tone="teal" href="/finance/closing" label="Monthly closing" value="Checklist" hint="Depreciation is one of its items" />
      </StatStrip>
      <Card
        title={`Depreciation for ${formatPeriod(period)}`}
        description={month.posted ? "As posted" : "Worked out from the asset cards — straight-line, from the month of purchase"}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CsvButton
              filename={`depreciation-${period}`}
              rows={[
                ["Asset", "Name", "Category", "Charged to", "Depreciation", "Book value after"],
                ...month.lines.map((l) => [l.asset.number, l.asset.name, ASSET_CATEGORY_LABELS[l.asset.category], l.projectCode, l.amount, l.bookValueAfter]),
              ]}
            />
            {month.posted ? (
              <StatusPill tone="success">Posted</StatusPill>
            ) : (
              <ActionButton action={postDepreciationAction.bind(null, period)} label="Post depreciation" size="sm" />
            )}
          </div>
        }
      >
        <Table
          data={month.lines}
          rowKey={(l) => l.asset.uuid}
          emptyMessage="No asset carries depreciation this month."
          columns={[
            {
              key: "asset",
              header: "Asset",
              render: (l) => (
                <div className="flex flex-col gap-0.5">
                  <Link href={`/finance/assets/${l.asset.uuid}`} className="font-medium text-ink after:absolute after:inset-0">
                    {l.asset.name}
                  </Link>
                  <span dir="ltr" className="text-xs text-muted">
                    {l.asset.number}
                  </span>
                </div>
              ),
            },
            { key: "category", header: "Category", render: (l) => <span className="text-secondary">{ASSET_CATEGORY_LABELS[l.asset.category]}</span> },
            { key: "project", header: "Charged to", render: (l) => <span dir="ltr">{l.projectCode}</span> },
            { key: "amount", header: "Depreciation", align: "end", render: (l) => <span className="font-medium">{formatMoney(l.amount)}</span> },
            { key: "book", header: "Book value after", align: "end", render: (l) => formatMoney(l.bookValueAfter) },
          ]}
        />
      </Card>
    </>
  );
};
