import { listTasks } from "services";
import { EmptyState } from "ui";
import { TaskStatus } from "@/db/enum";
import { TASK_STATUS_LABELS } from "@/db/label";
import { getCurrentStaff } from "@/lib/server/auth";
import { TaskCard } from "./task-card";

type MyTasksBoardProps = {
  /** "mine" — given to me; "given" — given by me to others. */
  side: "mine" | "given";
};

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "on_hold", "in_review", "done"];

/** How many finished tasks the Done column keeps showing. */
const DONE_SHOWN = 5;

const DOT: Record<TaskStatus, string> = {
  todo: "bg-faint",
  in_progress: "bg-primary",
  on_hold: "bg-warning",
  in_review: "bg-violet",
  done: "bg-success",
  cancelled: "bg-faint",
};

/** The current user's tasks as a board, one column per stage. */
export const MyTasksBoard = async ({ side }: MyTasksBoardProps) => {
  const actor = await getCurrentStaff();
  const rows = await listTasks(side === "mine" ? { assigneeUuid: actor.uuid } : { assignedByUuid: actor.uuid });
  const shown = side === "given" ? rows.filter((r) => r.assigneeUuid !== actor.uuid) : rows;
  if (shown.length === 0) {
    return (
      <EmptyState title={side === "mine" ? "No tasks for you" : "You have not given any tasks"}>
        {side === "mine" ? "Tasks given to you show here as soon as they are given." : "Give one with “New task”."}
      </EmptyState>
    );
  }
  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-5">
      {COLUMNS.map((status) => {
        const all = shown.filter((r) => r.status === status);
        const cards = status === "done" ? [...all].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? "")).slice(0, DONE_SHOWN) : all;
        return (
          <section key={status} className="flex flex-col gap-3 rounded-card border border-hairline bg-page p-3">
            <header className="flex items-center justify-between px-1 pt-1">
              <span className="flex items-center gap-2 text-sm font-medium text-ink">
                <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
                {TASK_STATUS_LABELS[status]}
              </span>
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted ring-1 ring-hairline">{all.length}</span>
            </header>
            {cards.length === 0 ? (
              <p className="px-1 pb-2 text-xs text-faint">Nothing here</p>
            ) : (
              cards.map((task) => <TaskCard key={task.uuid} task={task} person={side === "mine" ? "giver" : "assignee"} />)
            )}
          </section>
        );
      })}
    </div>
  );
};
