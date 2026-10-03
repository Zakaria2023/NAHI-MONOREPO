import Link from "next/link";
import { listTasks } from "services";
import { Card, EmptyState, StatusPill } from "ui";
import { TASK_STATUS_LABELS } from "@/db/label";
import { DueMark } from "@/components/tasks/due-mark";
import { getCurrentStaff } from "@/lib/server/auth";
import { TASK_TONES } from "@/lib/status-tones";

/** How many of my open tasks the dashboard lists. */
const SHOWN = 5;

/** The current user's open tasks, most urgent first. */
export const MyTasksPanel = async () => {
  const actor = await getCurrentStaff();
  const tasks = await listTasks({ assigneeUuid: actor.uuid, view: "open" });
  return (
    <Card
      title="My tasks"
      description={tasks.length ? `${tasks.length} open, ${tasks.filter((t) => !t.seenAt).length} new` : "Nothing open"}
      action={
        <Link href="/tasks/my" className="flex h-8 shrink-0 items-center rounded-full border border-hairline px-3.5 text-xs font-medium text-ink transition-colors hover:border-search-border hover:bg-hover">
          View all
        </Link>
      }
    >
      {tasks.length === 0 ? (
        <EmptyState title="No open tasks">Tasks given to you show here.</EmptyState>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {tasks.slice(0, SHOWN).map((task) => (
            <li key={task.uuid} className="relative flex items-start justify-between gap-3 rounded-control px-2 py-2.5 transition-colors hover:bg-hover">
              <div className="flex flex-col gap-1">
                <Link href={`/tasks/${task.uuid}`} className="text-sm font-medium text-ink after:absolute after:inset-0">
                  {task.title}
                </Link>
                <span className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={TASK_TONES[task.status]}>{task.seenAt ? TASK_STATUS_LABELS[task.status] : "New"}</StatusPill>
                  <span className="text-xs text-muted">from {task.assignedByName}</span>
                </span>
              </div>
              <div className="shrink-0 text-end">
                <DueMark task={task} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
