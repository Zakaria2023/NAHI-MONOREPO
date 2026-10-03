import { Actor, TaskDetail, taskMoveBlocker } from "services";
import { Card } from "ui";
import { formatDateTime } from "utils";
import { addChecklistItemAction, toggleChecklistItemAction } from "@/app/(dashboard)/tasks/[uuid]/actions";
import { ProgressBar } from "@/components/shared/progress-bar";
import { ChecklistItemToggle } from "./checklist-item-toggle";
import { ChecklistItemForm } from "./checklist-item-form";

type TaskChecklistCardProps = {
  detail: TaskDetail;
  actor: Actor;
};

/** The steps of the task. The assignee ticks them; every one is ticked before it is handed in. */
export const TaskChecklistCard = ({ detail, actor }: TaskChecklistCardProps) => {
  const { task, row } = detail;
  const tickBlocker = taskMoveBlocker(task, actor, "tick");
  const canAdd = !taskMoveBlocker(task, actor, "add_item");
  if (task.checklist.length === 0 && !canAdd) {
    return null;
  }
  return (
    <Card
      title="Checklist"
      description={row.progress.total ? `${row.progress.done} of ${row.progress.total} done` : "No steps yet"}
      action={
        row.progress.total > 0 && (
          <div className="w-32 pt-2">
            <ProgressBar value={row.progress.done / row.progress.total} />
          </div>
        )
      }
    >
      <div className="flex flex-col gap-5">
        {task.checklist.length > 0 && (
          <ul className="flex flex-col gap-3">
            {task.checklist.map((item) => (
              <li key={item.uuid} className="flex flex-col gap-0.5">
                <ChecklistItemToggle action={toggleChecklistItemAction.bind(null, task.uuid, item.uuid)} done={Boolean(item.doneAt)} label={item.text} blocker={tickBlocker} />
                {item.doneAt && (
                  <span className="ps-7 text-xs text-muted">
                    {item.doneBy} · {formatDateTime(item.doneAt)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {tickBlocker && task.assigneeUuid === actor.uuid && task.checklist.length > 0 && <p className="text-xs text-muted">{tickBlocker}</p>}
        {canAdd && <ChecklistItemForm action={addChecklistItemAction.bind(null, task.uuid)} />}
      </div>
    </Card>
  );
};
