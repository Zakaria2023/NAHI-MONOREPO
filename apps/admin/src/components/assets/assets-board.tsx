import { ClipboardCheck, Landmark, Package, TrendingDown } from "lucide-react";
import { listFixedAssets } from "services";
import { Card, StatStrip, StatTile } from "ui";
import { formatMoney, round2, sumBy } from "utils";
import { CsvButton } from "@/components/shared/csv-button";
import { AssetsTable } from "./assets-table";

type AssetsBoardProps = {
  /** "active", "disposed" or "all". */
  status: string;
};

export const AssetsBoard = async ({ status }: AssetsBoardProps) => {
  const all = await listFixedAssets();
  const active = all.filter((a) => a.status === "active");
  const shown = status === "all" ? all : all.filter((a) => a.status === status);
  const year = new Date().getUTCFullYear();
  return (
    <>
      <StatStrip columns="sm:grid-cols-2 xl:grid-cols-4">
        <StatTile tone="primary" label="Assets in use" value={active.length} hint={`${all.length - active.length} disposed`} icon={<Package size={18} />} />
        <StatTile tone="violet" label="Cost" value={formatMoney(round2(sumBy(active, (a) => a.cost)))} hint="Of the assets in use" icon={<Landmark size={18} />} />
        <StatTile
          tone="teal"
          href="/finance/depreciation"
          label="Net book value"
          value={formatMoney(round2(sumBy(active, (a) => a.bookValue)))}
          hint={`${formatMoney(round2(sumBy(active, (a) => a.monthly)))} depreciation a month`}
          icon={<TrendingDown size={18} />}
        />
        <StatTile
          tone="warning"
          label={`Annual count ${year}`}
          value={`${active.filter((a) => a.countedThisYear).length} / ${active.length}`}
          hint="Counted and matched to the register"
          icon={<ClipboardCheck size={18} />}
        />
      </StatStrip>
      <Card
        title="Asset register"
        description="Book values as of this month"
        action={
          <CsvButton
            filename="fixed-asset-register"
            rows={[
              ["Number", "Asset", "Category", "Serial", "Purchased", "Cost", "Life (months)", "Accumulated", "Book value", "Held by", "Status"],
              ...shown.map((a) => [a.number, a.name, a.category, a.serialNumber, a.purchaseDate.slice(0, 10), a.cost, a.usefulLifeMonths, a.accumulated, a.bookValue, a.holderLabel, a.status]),
            ]}
          />
        }
      >
        <AssetsTable assets={shown} />
      </Card>
    </>
  );
};
