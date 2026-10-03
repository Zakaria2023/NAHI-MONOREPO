import { Actor, TaskDetail, isAssignee, isReviewer, taskMoveBlocker } from "services";
import { Card, DropdownOption } from "ui";
import { formatDateTime } from "utils";
import {
  approveTaskAction,
  cancelTaskAction,
  holdTaskAction,
  reassignTaskAction,
  resumeTaskAction,
  returnTaskAction,
  startTaskAction,
  submitTaskAction,
} from "@/app/(dashboard)/tasks/[uuid]/actions";
import { ActionButton } from "@/components/shared/action-button";
import { FormDialog } from "@/components/shared/form-dialog";
import { BlockedNote } from "@/components/warehouse/blocked-note";
import { TaskNoteForm } from "./task-note-form";
import { TaskReassignForm } from "./task-reassign-form";

type TaskActionsCardProps = {
  detail: TaskDetail;
  actor: Actor;
  staff: DropdownOption[];
};

/** What the current user can do with the task now — the assignee's moves, then the giver's. */
export const TaskActionsCard = ({ detail, actor, staff }: TaskActionsCardProps) => {
  const { task, row } = detail;
  const uuid = task.uuid;
  const mine = isAssignee(task, actor);
  const reviewer = isReviewer(task, actor);
  const open = task.status !== "done" && task.status !== "cancelled";
  const submitBlocker = taskMoveBlocker(task, actor, "submit");
  if (!open) {
    return (
      <Card title="Outcome">
        <p className="text-sm text-secondary">
          {task.status === "done"
            ? `Accepted as done by ${row.assignedByName} on ${formatDateTime(task.completedAt)}.`
            : `Cancelled on ${formatDateTime(task.cancelledAt)}${task.reason ? ` — ${task.reason}` : ""}.`}
        </p>
      </Card>
    );
  }
  if (!mine && !reviewer) {
    return (
      <Card title="Next step">
        <BlockedNote reason={`Only ${row.assigneeName} works on this task and only ${row.assignedByName} accepts it. Anyone can comment below.`} />
      </Card>
    );
  }
  return (
    <>
      {mine && (
        <Card title="Your next step" description={`Given to you by ${row.assignedByName}`}>
          <div className="flex flex-col gap-5">
            {task.status === "todo" && <ActionButton action={startTaskAction.bind(null, uuid)} label="Start working on it" />}
            {task.status === "on_hold" && (
              <div className="flex flex-col gap-3">
                <BlockedNote reason={`On hold: ${task.reason ?? "no reason given"}`} />
                <ActionButton action={resumeTaskAction.bind(null, uuid)} label="Resume work" />
              </div>
            )}
            {task.status === "in_progress" && (
              <div className="flex flex-wrap items-start gap-3">
                <FormDialog
                  label="Hand in as finished"
                  title="Hand in as finished"
                  description={`It goes to ${row.assignedByName} to accept`}
                  variant="success"
                  blocker={submitBlocker}
                >
                  <TaskNoteForm action={submitTaskAction.bind(null, uuid)} submitLabel="Hand in as finished" label="Note for the reviewer" placeholder="What was done, anything to check" variant="success" />
                </FormDialog>
                <FormDialog label="Put on hold" title="Put on hold" description="Blocked? Say what the task is waiting for">
                  <TaskNoteForm action={holdTaskAction.bind(null, uuid)} submitLabel="Put on hold" label="What it is waiting for" required />
                </FormDialog>
              </div>
            )}
            {task.status === "in_review" && <BlockedNote reason={`Handed in ${formatDateTime(task.submittedAt)} — waiting for ${row.assignedByName} to accept it`} />}
          </div>
        </Card>
      )}
      {reviewer && (
        <Card title="Review and manage" description={actor.uuid === task.assignedByUuid ? "You gave this task" : "As system admin"}>
          <div className="flex flex-col gap-6">
            {task.status === "in_review" && (
              <div className="flex flex-wrap items-start gap-3">
                <FormDialog label="Accept as done" title="Accept as done" description={`Handed in by ${row.assigneeName}`} variant="success">
                  <TaskNoteForm action={approveTaskAction.bind(null, uuid)} submitLabel="Accept as done" label="Note" placeholder="Optional" variant="success" />
                </FormDialog>
                <FormDialog label="Send back" title="Send back" description={`Not finished — it goes back to ${row.assigneeName}`}>
                  <TaskNoteForm action={returnTaskAction.bind(null, uuid)} submitLabel="Send back" label="What is still missing" required />
                </FormDialog>
              </div>
            )}
            {task.status !== "in_review" && !mine && (
              <BlockedNote
                reason={
                  task.status === "todo"
                    ? task.seenAt
                      ? `${row.assigneeName} has seen it and not started yet`
                      : `${row.assigneeName} has not opened it yet`
                    : task.status === "on_hold"
                      ? `On hold: ${task.reason ?? "no reason given"}`
                      : `${row.assigneeName} is working on it — day ${row.clock.workingDays ?? 1}`
                }
              />
            )}
            {task.status !== "in_review" && (
              <div className="flex flex-wrap items-start gap-3 border-t border-hairline-soft pt-5">
                <FormDialog label="Reassign" title="Reassign" description={`Give the task to someone other than ${row.assigneeName}`}>
                  <TaskReassignForm action={reassignTaskAction.bind(null, uuid)} staff={staff.filter((s) => s.value !== task.assigneeUuid)} />
                </FormDialog>
                <FormDialog label="Cancel task" title="Cancel the task" description="It closes without being done" variant="danger">
                  <TaskNoteForm action={cancelTaskAction.bind(null, uuid)} submitLabel="Cancel task" label="Why it is no longer needed" required />
                </FormDialog>
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
};
