import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react";
import { TaskDetail } from "services";
import { Card } from "ui";
import { formatDateTime } from "utils";
import { FactList } from "@/components/shared/fact-list";

type TaskTrackingCardProps = {
  detail: TaskDetail;
};

type Milestone = {
  label: string;
  at?: string;
  note?: string;
  /** The step the task is waiting on now. */
  current?: boolean;
  failed?: boolean;
};

/** Where the task is in its life — given, seen, started, handed in, done — and its day counts. */
export const TaskTrackingCard = ({ detail }: TaskTrackingCardProps) => {
  const { task, row } = detail;
  const { clock } = row;
  const open = task.status !== "done" && task.status !== "cancelled";
  const milestones: Milestone[] = [
    { label: `Given by ${row.assignedByName}`, at: task.assignedAt },
    { label: `Seen by ${row.assigneeName}`, at: task.seenAt, current: open && !task.seenAt },
    { label: "Work started", at: task.startedAt, current: open && Boolean(task.seenAt) && !task.startedAt },
    {
      label: "Handed in as finished",
      at: task.submittedAt,
      note: task.returnedCount > 0 ? `Sent back ${task.returnedCount} time(s)` : undefined,
      current: task.status === "in_progress" || task.status === "on_hold",
    },
    task.status === "cancelled"
      ? { label: "Cancelled", at: task.cancelledAt, note: task.reason, failed: true }
      : { label: `Accepted by ${row.assignedByName}`, at: task.completedAt, current: task.status === "in_review" },
  ];
  return (
    <Card title="Tracking" description="Seen, started, finished — and how many days it took">
      <div className="flex flex-col gap-6">
        <ol className="flex flex-col gap-3">
          {milestones.map((m) => (
            <li key={m.label} className="flex items-start gap-3">
              <span className="mt-0.5">
                {m.failed ? (
                  <XCircle size={18} className="text-danger" />
                ) : m.at ? (
                  <CheckCircle2 size={18} className="text-success" />
                ) : m.current ? (
                  <Clock size={18} className="text-warning" />
                ) : (
                  <Circle size={18} className="text-faint" />
                )}
              </span>
              <div className="flex flex-col">
                <span className="text-sm text-ink">{m.label}</span>
                <span className="text-xs text-muted">
                  {m.at ? formatDateTime(m.at) : m.current ? "Waiting" : "Not yet"}
                  {m.note && ` — ${m.note}`}
                </span>
              </div>
            </li>
          ))}
        </ol>
        <div className="border-t border-hairline-soft pt-5">
          <FactList
            facts={[
              { label: "Working days", value: clock.workingDays === null ? "Not started" : `${clock.workingDays} day(s)` },
              { label: "Days with work logged", value: `${clock.loggedDays} day(s)` },
              { label: "Hours logged", value: `${clock.loggedHours} h` },
              { label: open ? "Days since given" : "Days from given to closed", value: `${clock.assignedDays} day(s)` },
              {
                label: "Seen",
                value:
                  clock.seenAfterHours === null
                    ? "Not yet"
                    : clock.seenAfterHours < 1
                      ? "Within the hour"
                      : `${Math.round(clock.seenAfterHours)} h after it was given`,
              },
              {
                label: "Deadline",
                value:
                  clock.lateDays > 0
                    ? open
                      ? `${clock.lateDays} day(s) late`
                      : `Finished ${clock.lateDays} day(s) late`
                    : clock.dueInDays === null
                      ? task.status === "done"
                        ? "Finished on time"
                        : "—"
                      : clock.dueInDays === 0
                        ? "Due today"
                        : `${clock.dueInDays} day(s) left`,
              },
            ]}
          />
        </div>
      </div>
    </Card>
  );
};
