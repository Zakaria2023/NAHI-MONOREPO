import { calendarDaysBetween, round2, sumBy } from "utils";
import { TaskStatus } from "../../../../db/enum";
import { TASK_STATUS_LABELS } from "../../../../db/label";
import { Task, TaskWorkLog } from "../../../../db/types";
import { Actor } from "../core/actor";

// TASK RULES. A task is the assignee's to work on and the giver's to accept:
// only the assignee starts, holds, logs work and hands it in; only the giver
// (or the system admin) accepts it, sends it back, reassigns or cancels it.
// Being "seen" is the assignee opening it — nobody else's visit counts.

export type TaskMove =
  | "start"
  | "hold"
  | "resume"
  | "submit"
  | "approve"
  | "return"
  | "cancel"
  | "reassign"
  | "log_work"
  | "tick"
  | "add_item";

/** The day counts every task screen shows. */
export type TaskClock = {
  /** Days since it reached its assignee, until it closed (or today). */
  assignedDays: number;
  /** Hours from assignment until the assignee first opened it; null while unseen. */
  seenAfterHours: number | null;
  /** Calendar days from the day work started to the day it was handed in, finished or stopped (or today), counting both. Null before it starts. */
  workingDays: number | null;
  /** Distinct days the assignee logged work on. */
  loggedDays: number;
  loggedHours: number;
  /** Days until the due date — negative once it has passed. Null once closed. */
  dueInDays: number | null;
  /** Days past the due date while still open, or finished after it. 0 when on time. */
  lateDays: number;
};

export type ChecklistProgress = {
  done: number;
  total: number;
};

/** A day's logged hours cannot exceed this. */
export const MAX_HOURS_PER_DAY = 24;

/** A task due within this many days raises an alert. */
export const TASK_DUE_WARNING_DAYS = 2;

const CLOSED: TaskStatus[] = ["done", "cancelled"];

/** Why the assignee cannot log work or tick the checklist, for each status that is not "in progress". */
const NOT_WORKING: Record<Exclude<TaskStatus, "in_progress">, string> = {
  todo: "Start the task first",
  on_hold: "Resume the task first",
  in_review: "It is handed in and waiting for review",
  done: "The task is done",
  cancelled: "The task was cancelled",
};

export const isTaskOpen = (task: Pick<Task, "status">): boolean => !CLOSED.includes(task.status);

export const isAssignee = (task: Pick<Task, "assigneeUuid">, actor: Pick<Actor, "uuid">): boolean => task.assigneeUuid === actor.uuid;

/** The giver reviews; the system admin may stand in for anyone. */
export const isReviewer = (task: Pick<Task, "assignedByUuid">, actor: Pick<Actor, "uuid" | "role">): boolean =>
  task.assignedByUuid === actor.uuid || actor.role === "system_admin";

export const checklistProgress = (task: Pick<Task, "checklist">): ChecklistProgress => ({
  done: task.checklist.filter((i) => i.doneAt).length,
  total: task.checklist.length,
});

/** When the task stopped running: accepted, cancelled, or handed in and waiting. */
const endOf = (task: Task): string | undefined =>
  task.completedAt ?? task.cancelledAt ?? (task.status === "in_review" ? task.submittedAt : undefined);

export const taskClock = (task: Task, now: string): TaskClock => {
  const end = endOf(task) ?? now;
  const dueIn = calendarDaysBetween(now, task.dueAt);
  const finishedLate = task.completedAt ? calendarDaysBetween(task.dueAt, task.completedAt) : 0;
  return {
    assignedDays: Math.max(0, calendarDaysBetween(task.assignedAt, isTaskOpen(task) ? now : end)),
    seenAfterHours: task.seenAt ? round2((Date.parse(task.seenAt) - Date.parse(task.assignedAt)) / 3_600_000) : null,
    workingDays: task.startedAt ? Math.max(1, calendarDaysBetween(task.startedAt, end) + 1) : null,
    loggedDays: new Set(task.workLogs.map((l) => l.date.slice(0, 10))).size,
    loggedHours: round2(sumBy(task.workLogs, (l) => l.hours)),
    dueInDays: isTaskOpen(task) ? dueIn : null,
    lateDays: task.status === "cancelled" ? 0 : Math.max(0, isTaskOpen(task) ? -dueIn : finishedLate),
  };
};

export const isTaskOverdue = (task: Task, now: string): boolean => isTaskOpen(task) && calendarDaysBetween(now, task.dueAt) < 0;

/** Why `actor` cannot make this move on the task now, or null if they can. */
export const taskMoveBlocker = (task: Task, actor: Actor, move: TaskMove): string | null => {
  if (!isTaskOpen(task)) {
    return `This task is ${TASK_STATUS_LABELS[task.status].toLowerCase()}`;
  }
  const assigneeOnly = ["start", "hold", "resume", "submit", "log_work", "tick"].includes(move);
  if (assigneeOnly && !isAssignee(task, actor)) {
    return "Only the person the task is assigned to can do this";
  }
  if (["approve", "return", "cancel", "reassign"].includes(move) && !isReviewer(task, actor)) {
    return "Only the person who gave the task can do this";
  }
  if (move === "add_item" && !isAssignee(task, actor) && !isReviewer(task, actor)) {
    return "Only the assignee or the person who gave the task can change the checklist";
  }
  switch (move) {
    case "start":
      return task.status === "todo" ? null : "The task has already been started";
    case "hold":
      return task.status === "in_progress" ? null : "Only a task in progress can be put on hold";
    case "resume":
      return task.status === "on_hold" ? null : "The task is not on hold";
    case "submit": {
      if (task.status !== "in_progress") {
        return "Only a task in progress can be handed in";
      }
      const { done, total } = checklistProgress(task);
      if (done < total) {
        return `Tick the ${total - done} open checklist item(s) first`;
      }
      return task.workLogs.length === 0 ? "Log the work done before handing it in" : null;
    }
    case "approve":
    case "return":
      return task.status === "in_review" ? null : "The task has not been handed in for review";
    case "reassign":
      return task.status === "in_review" ? "Accept or send it back before reassigning it" : null;
    case "log_work":
    case "tick":
      return task.status === "in_progress" ? null : NOT_WORKING[task.status];
    case "add_item":
      return task.status === "in_review" ? "It is handed in — send it back to add steps" : null;
    case "cancel":
      return null;
  }
};

/** Why a day's work cannot be logged, or null. `date` is the day worked. */
export const workLogBlocker = (task: Task, entry: Pick<TaskWorkLog, "date" | "hours">, now: string): string | null => {
  if (!(entry.hours > 0)) {
    return "Enter the hours worked";
  }
  if (task.startedAt && calendarDaysBetween(task.startedAt, entry.date) < 0) {
    return "The day is before the task was started";
  }
  if (calendarDaysBetween(now, entry.date) > 0) {
    return "Work cannot be logged for a day that has not come";
  }
  const sameDay = sumBy(
    task.workLogs.filter((l) => l.date.slice(0, 10) === entry.date.slice(0, 10)),
    (l) => l.hours,
  );
  if (sameDay + entry.hours > MAX_HOURS_PER_DAY) {
    return `That day already has ${sameDay} hour(s) logged — no more than ${MAX_HOURS_PER_DAY} in a day`;
  }
  return null;
};
