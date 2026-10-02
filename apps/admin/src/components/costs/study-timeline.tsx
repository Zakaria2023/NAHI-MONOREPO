import { BudgetScheduleItem } from "services";
import { EmptyState } from "ui";
import { formatDate } from "utils";
import { STUDY_RESOURCE_LABELS } from "@/db/label";
import { removeScheduleItemAction } from "@/app/(dashboard)/finance/budgets/[projectUuid]/study/actions";
import { ActionButton } from "@/components/shared/action-button";

type StudyTimelineProps = {
  projectUuid: string;
  items: BudgetScheduleItem[];
};

const BAR = {
  materials: "bg-primary",
  manpower: "bg-teal",
  equipment: "bg-orange",
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** The study's timelines as bars across the project's months — one row per resource. */
export const StudyTimeline = ({ projectUuid, items }: StudyTimelineProps) => {
  if (items.length === 0) {
    return <EmptyState title="No timelines yet">Add when materials, manpower and equipment are needed on site.</EmptyState>;
  }
  const start = Math.min(...items.map((i) => new Date(i.startsAt).getTime()));
  const end = Math.max(...items.map((i) => new Date(i.endsAt).getTime())) + DAY_MS;
  const span = end - start;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between text-xs text-muted">
        <span>{formatDate(new Date(start).toISOString())}</span>
        <span>{formatDate(new Date(end - DAY_MS).toISOString())}</span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => {
          const from = new Date(item.startsAt).getTime();
          const to = new Date(item.endsAt).getTime() + DAY_MS;
          return (
            <li key={item.uuid} className="grid grid-cols-1 items-center gap-2 md:grid-cols-12">
              <div className="flex flex-col md:col-span-3">
                <span className="text-sm text-ink">{item.description}</span>
                <span className="text-xs text-muted">{STUDY_RESOURCE_LABELS[item.resource]}</span>
              </div>
              <div className="relative h-7 rounded-md bg-hover md:col-span-7">
                <div
                  className={`absolute inset-y-1 rounded ${BAR[item.resource]}`}
                  style={{ insetInlineStart: `${((from - start) / span) * 100}%`, width: `${Math.max(((to - from) / span) * 100, 1.5)}%` }}
                  title={`${formatDate(item.startsAt)} – ${formatDate(item.endsAt)}`}
                />
              </div>
              <div className="flex justify-end md:col-span-2 print:hidden">
                <ActionButton action={removeScheduleItemAction.bind(null, projectUuid, item.uuid)} label="Remove" size="sm" variant="outline" />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted">
        {(["materials", "manpower", "equipment"] as const).map((r) => (
          <span key={r} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${BAR[r]}`} />
            {STUDY_RESOURCE_LABELS[r]}
          </span>
        ))}
      </div>
    </div>
  );
};
