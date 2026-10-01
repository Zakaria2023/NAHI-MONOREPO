import { assetCustodyBlockers, listAssetCustodies } from "services";
import { PillTone, StatusPill, Table } from "ui";
import { formatDate, formatNumber } from "utils";
import { AssetCustodyStatus } from "@/db/enum";
import { ASSET_CUSTODY_STATUS_LABELS, INVENTORY_FREQUENCY_LABELS } from "@/db/label";
import { getCurrentStaff } from "@/lib/server/auth";
import { AssetCustodyActions } from "./asset-custody-actions";

type AssetCustodyTableProps = {
  filter?: "open" | "overdue" | "closed";
};

const ASSET_TONES: Record<AssetCustodyStatus, PillTone> = {
  with_employee: "info",
  returned: "success",
  lost: "danger",
  damaged: "warning",
};

/** Fixed assets in employees' custody, when each was last counted and when the next count falls due. */
export const AssetCustodyTable = async ({ filter }: AssetCustodyTableProps) => {
  const [rows, actor] = await Promise.all([listAssetCustodies(), getCurrentStaff()]);
  const blockers = assetCustodyBlockers(actor);
  const shown = rows.filter((r) =>
    filter === "open" ? r.status === "with_employee" : filter === "overdue" ? r.countOverdue : filter === "closed" ? r.status !== "with_employee" : true,
  );
  return (
    <Table
      data={shown}
      rowKey={(r) => r.uuid}
      emptyMessage="No custody here. Fixed assets become custody when an issue request for them is issued to an employee."
      columns={[
        { key: "employee", header: "Employee", render: (r) => <span className="font-medium">{r.employeeName}</span> },
        {
          key: "item",
          header: "Item",
          render: (r) => (
            <div className="flex flex-col">
              <span dir="ltr">
                {r.item.code} × {formatNumber(r.qty)}
              </span>
              <span className="text-xs text-muted">{r.item.name}</span>
            </div>
          ),
        },
        { key: "project", header: "Project", render: (r) => <span dir="ltr">{r.projectCode}</span> },
        { key: "frequency", header: "Count", render: (r) => INVENTORY_FREQUENCY_LABELS[r.inventoryFrequency] },
        {
          key: "last",
          header: "Last counted",
          render: (r) => <span className="whitespace-nowrap">{r.lastCountedAt ? formatDate(r.lastCountedAt) : <span className="text-muted">Never</span>}</span>,
        },
        {
          key: "next",
          header: "Next count",
          render: (r) =>
            r.status !== "with_employee" ? (
              <span className="text-muted">—</span>
            ) : r.countOverdue ? (
              <StatusPill tone="danger">Overdue · {formatDate(r.nextCountAt)}</StatusPill>
            ) : (
              <span className="whitespace-nowrap">{formatDate(r.nextCountAt)}</span>
            ),
        },
        {
          key: "status",
          header: "Status",
          render: (r) => (
            <div className="flex flex-col gap-1">
              <StatusPill tone={ASSET_TONES[r.status]}>{ASSET_CUSTODY_STATUS_LABELS[r.status]}</StatusPill>
              {r.closedAt && <span className="text-xs text-muted">{formatDate(r.closedAt)}</span>}
            </div>
          ),
        },
        {
          key: "actions",
          header: "",
          align: "end",
          render: (r) =>
            r.status === "with_employee" ? (
              <AssetCustodyActions uuid={r.uuid} countBlocker={blockers.count} closeBlocker={blockers.close} />
            ) : null,
        },
      ]}
    />
  );
};
