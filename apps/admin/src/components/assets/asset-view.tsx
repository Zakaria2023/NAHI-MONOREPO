import { getFixedAsset, listWarehouseOptions } from "services";
import { Card, StatStrip, StatTile, StatusPill } from "ui";
import { formatDate, formatMoney } from "utils";
import { ASSET_CATEGORY_LABELS, ASSET_DISPOSAL_KIND_LABELS, ASSET_STATUS_LABELS } from "@/db/label";
import { countAssetAction, disposeAssetAction, transferAssetAction } from "@/app/(dashboard)/finance/assets/[uuid]/actions";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { AssetCountForm } from "./asset-count-form";
import { AssetDisposalForm } from "./asset-disposal-form";
import { AssetHistory } from "./asset-history";
import { AssetScheduleTable } from "./asset-schedule-table";
import { AssetTransferForm } from "./asset-transfer-form";

type AssetViewProps = {
  uuid: string;
};

/** The asset card of finance §7, with what can still happen to the asset. */
export const AssetView = async ({ uuid }: AssetViewProps) => {
  const [{ asset, schedule, transfers }, warehouses] = await Promise.all([getFixedAsset(uuid), listWarehouseOptions()]);
  const active = asset.status === "active";
  return (
    <>
      <PageHeader
        title={asset.name}
        description={`${asset.number} · ${ASSET_CATEGORY_LABELS[asset.category]} · serial ${asset.serialNumber}`}
        back={{ href: "/finance/assets", label: "Fixed assets" }}
        meta={<StatusPill tone={active ? "success" : "neutral"}>{ASSET_STATUS_LABELS[asset.status]}</StatusPill>}
      />
      <StatStrip columns="sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Cost" value={formatMoney(asset.cost)} hint={`Salvage ${formatMoney(asset.salvageValue)}`} />
        <StatTile label="Depreciation to date" value={formatMoney(asset.accumulated)} hint={`${formatMoney(asset.monthly)} a month, straight-line`} />
        <StatTile
          label={active ? "Book value" : "Book value at disposal"}
          value={formatMoney(active ? asset.bookValue : (asset.disposal?.bookValue ?? 0))}
          hint={active ? "As of this month" : formatDate(asset.disposal?.at)}
        />
        <StatTile label="Useful life" value={`${asset.usefulLifeMonths} months`} hint={`From ${formatDate(asset.purchaseDate)}`} />
      </StatStrip>
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card title="Asset card" action={<PrintButton />}>
            <FactList
              columns={3}
              facts={[
                { label: "Asset number", value: <span dir="ltr">{asset.number}</span> },
                { label: "Category", value: ASSET_CATEGORY_LABELS[asset.category] },
                { label: "Serial number", value: <span dir="ltr">{asset.serialNumber}</span> },
                { label: "Purchase date", value: formatDate(asset.purchaseDate) },
                { label: "Cost", value: formatMoney(asset.cost) },
                { label: "Useful life", value: `${asset.usefulLifeMonths} months` },
                { label: "Location / custodian", value: asset.holderLabel },
                { label: "Depreciation charged to", value: <span dir="ltr">{asset.projectCode ?? "Head office"}</span> },
                { label: "Registered by", value: `${asset.createdBy} · ${formatDate(asset.createdAt)}` },
              ]}
            />
            {asset.disposal && (
              <p className="mt-5 rounded-control border border-hairline-soft bg-hover px-4 py-3 text-sm text-secondary">
                {ASSET_DISPOSAL_KIND_LABELS[asset.disposal.kind]} {formatDate(asset.disposal.at)} by {asset.disposal.by} for{" "}
                {formatMoney(asset.disposal.proceeds)} against a book value of {formatMoney(asset.disposal.bookValue)} —{" "}
                <span className={asset.disposal.gainLoss >= 0 ? "text-success" : "text-danger"}>
                  {asset.disposal.gainLoss >= 0 ? "gain" : "loss"} of {formatMoney(Math.abs(asset.disposal.gainLoss))}
                </span>
                {asset.disposal.note && `. ${asset.disposal.note}`}.
              </p>
            )}
          </Card>
          <Card title="Depreciation schedule" description="Straight-line, one row per year of its useful life">
            <AssetScheduleTable schedule={schedule} />
          </Card>
          <Card title="History" description="Transfers and annual counts">
            <AssetHistory transfers={transfers} counts={asset.counts} />
          </Card>
        </div>
        {active && (
          <div className="flex flex-col gap-6 print:hidden">
            <Card title="Annual count" description={asset.countedThisYear ? "Already counted this year" : "Found where the register says, and in what state"}>
              {asset.countedThisYear ? (
                <p className="text-sm text-muted">The next count is due next year.</p>
              ) : (
                <AssetCountForm action={countAssetAction.bind(null, asset.uuid)} />
              )}
            </Card>
            <Card title="Transfer" description="To a warehouse or to an employee; the card follows it">
              <AssetTransferForm action={transferAssetAction.bind(null, asset.uuid)} warehouses={warehouses} />
            </Card>
            <Card title="Sell or scrap" description="Takes it off the books, with the gain or loss against its book value">
              <AssetDisposalForm action={disposeAssetAction.bind(null, asset.uuid)} />
            </Card>
          </div>
        )}
      </div>
    </>
  );
};
