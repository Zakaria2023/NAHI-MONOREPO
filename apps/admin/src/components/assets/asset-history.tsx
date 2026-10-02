import { ArrowRightLeft, ClipboardCheck, ClipboardX } from "lucide-react";
import { FixedAssetDetail } from "services";
import { EmptyState } from "ui";
import { formatDate } from "utils";

type AssetHistoryProps = {
  transfers: FixedAssetDetail["transfers"];
  counts: FixedAssetDetail["asset"]["counts"];
};

/** Transfers and counts, newest first, in one list. */
export const AssetHistory = ({ transfers, counts }: AssetHistoryProps) => {
  const events = [
    ...transfers.map((t) => ({
      at: t.at,
      icon: <ArrowRightLeft size={16} />,
      chip: "bg-primary-tint text-primary",
      title: `Moved from ${t.from} to ${t.to}`,
      detail: `${t.by}${t.note ? ` — ${t.note}` : ""}`,
    })),
    ...counts.map((c) => ({
      at: c.at,
      icon: c.found ? <ClipboardCheck size={16} /> : <ClipboardX size={16} />,
      chip: c.found ? "bg-success-tint text-success" : "bg-danger-tint text-danger",
      title: c.found ? "Counted — found" : "Counted — missing",
      detail: `${c.by} — ${c.condition}`,
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return events.length === 0 ? (
    <EmptyState title="Nothing yet">No transfer or count has been recorded for this asset.</EmptyState>
  ) : (
    <ul className="flex flex-col gap-4">
      {events.map((e) => (
        <li key={`${e.at}-${e.title}`} className="flex items-start gap-3">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${e.chip}`}>{e.icon}</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-ink">{e.title}</span>
            <span className="text-xs text-muted">
              {formatDate(e.at)} · {e.detail}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
};
