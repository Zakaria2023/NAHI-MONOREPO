import { AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { ClosingView } from "services";
import { Card, StatusPill } from "ui";
import { formatDateTime } from "utils";
import { CLOSING_ITEM_LABELS } from "@/db/label";
import { closePeriodAction, tickClosingItemAction } from "@/app/(dashboard)/finance/closing/actions";
import { ActionButton } from "@/components/shared/action-button";
import { ProgressBar } from "@/components/shared/progress-bar";
import { DoneNote } from "./done-note";

type ClosingPeriodCardProps = {
  view: ClosingView;
  /** Only the finance manager closes; the service checks, this says so first. */
  canCloseRole: boolean;
};

/** Finance §5: the nine-item checklist, and the period's lock once all are done. */
export const ClosingPeriodCard = ({ view, canCloseRole }: ClosingPeriodCardProps) => {
  const done = view.items.filter((i) => i.done).length;
  const closeBlocker =
    done < view.items.length
      ? `${view.items.length - done} checklist item(s) still open.`
      : canCloseRole
        ? null
        : "Only the Finance manager closes a period — switch user at the foot of the sidebar.";
  return (
    <Card
      title={`Period ${view.period}`}
      description={view.closedAt ? `Closed by ${view.closedBy} on ${formatDateTime(view.closedAt)}` : `${done} of ${view.items.length} checklist items done`}
      action={view.closedAt ? <StatusPill tone="success">Closed</StatusPill> : <StatusPill tone="warning">Open</StatusPill>}
    >
      <div className="flex flex-col gap-4">
        <ProgressBar value={done / view.items.length} />
        <ol className="flex flex-col divide-y divide-hairline-soft">
          {view.items.map(({ item, done: mark, blocker }) => (
            <li key={item} className="grid grid-cols-1 items-start gap-2 py-3 first:pt-0 last:pb-0 md:grid-cols-12">
              <div className="flex items-start gap-2 md:col-span-6">
                {mark ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
                ) : blocker ? (
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
                ) : (
                  <Circle size={16} className="mt-0.5 shrink-0 text-faint" />
                )}
                <span className="text-sm text-ink">{CLOSING_ITEM_LABELS[item]}</span>
              </div>
              <div className="md:col-span-6 md:justify-self-end">
                {mark ? (
                  <DoneNote label="Done" by={mark.by} at={mark.at} />
                ) : view.closedAt ? null : blocker ? (
                  <p className="max-w-sm text-xs text-warning md:text-end">{blocker}</p>
                ) : (
                  <ActionButton action={tickClosingItemAction.bind(null, view.period, item)} label="Mark done" variant="outline" size="sm" />
                )}
              </div>
            </li>
          ))}
        </ol>
        {!view.closedAt && (
          <div className="border-t border-hairline-soft pt-4">
            <ActionButton action={closePeriodAction.bind(null, view.period)} label="Close period" blocker={closeBlocker} />
          </div>
        )}
      </div>
    </Card>
  );
};
