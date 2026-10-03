import Link from "next/link";
import { TaskView, listTasks } from "services";
import { StatusPill, Table } from "ui";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/db/label";
import { ProgressBar } from "@/components/shared/progress-bar";
import { TASK_PRIORITY_TONES, TASK_TONES } from "@/lib/status-tones";
import { DueMark } from "./due-mark";
import { SeenMark } from "./seen-mark";

type TasksTableProps = {
  view: TaskView;
  assigneeUuid?: string;
};

export const TasksTable = async ({ view, assigneeUuid }: TasksTableProps) => {
  const rows = await listTasks({ view, assigneeUuid });
  return (
    <Table
      data={rows}
      rowKey={(r) => r.uuid}
      pageSize={15}
      emptyMessage="No tasks here. Give one with “New task”."
      columns={[
        {
          key: "task",
          header: "Task",
          wrap: true,
          render: (r) => (
            <div className="flex min-w-56 flex-col gap-0.5">
              <Link href={`/tasks/${r.uuid}`} className="font-medium text-ink after:absolute after:inset-0 hover:text-primary">
                {r.title}
              </Link>
              <span className="text-xs text-muted">
                <span dir="ltr">{r.number}</span>
                {r.projectCode && (
                  <>
                    {" · "}
                    <span dir="ltr">{r.projectCode}</span>
                  </>
                )}
              </span>
            </div>
          ),
        },
        {
          key: "assignee",
          header: "Assigned to",
          render: (r) => (
            <div className="flex flex-col">
              <span>{r.assigneeName}</span>
              <span className="text-xs text-muted">by {r.assignedByName}</span>
            </div>
          ),
        },
        { key: "priority", header: "Priority", render: (r) => <StatusPill tone={TASK_PRIORITY_TONES[r.priority]}>{TASK_PRIORITY_LABELS[r.priority]}</StatusPill> },
        {
          key: "status",
          header: "Status",
          render: (r) => (
            <div className="flex flex-col gap-1">
              <StatusPill tone={TASK_TONES[r.status]}>{TASK_STATUS_LABELS[r.status]}</StatusPill>
              {r.returnedCount > 0 && <span className="text-xs text-muted">Sent back {r.returnedCount}×</span>}
            </div>
          ),
        },
        { key: "seen", header: "Seen", render: (r) => <SeenMark task={r} /> },
        { key: "due", header: "Due", render: (r) => <DueMark task={r} /> },
        {
          key: "days",
          header: "Working days",
          align: "end",
          render: (r) =>
            r.clock.workingDays === null ? (
              <span className="text-muted">Not started</span>
            ) : (
              <div className="flex flex-col items-end">
                <span className="font-medium">{r.clock.workingDays} day(s)</span>
                <span className="text-xs text-muted">
                  {r.clock.loggedHours} h over {r.clock.loggedDays} day(s)
                </span>
              </div>
            ),
        },
        {
          key: "checklist",
          header: "Checklist",
          render: (r) =>
            r.progress.total === 0 ? (
              <span className="text-muted">—</span>
            ) : (
              <div className="flex w-24 flex-col gap-1">
                <span className="text-xs text-muted">
                  {r.progress.done} of {r.progress.total}
                </span>
                <ProgressBar value={r.progress.done / r.progress.total} />
              </div>
            ),
        },
      ]}
    />
  );
};
