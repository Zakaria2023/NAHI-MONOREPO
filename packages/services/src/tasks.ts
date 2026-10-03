import { calendarDaysBetween, formatDate, generateUuid, nextDocumentNumber, nowIso, round2, sumBy, toIso } from "utils";
import {
  TaskChecklistItemInput,
  TaskCommentInput,
  TaskInput,
  TaskNoteInput,
  TaskReasonInput,
  TaskReassignInput,
  TaskWorkLogInput,
} from "validators";
import { readStore, transact } from "../../../db";
import { TaskStatus } from "../../../db/enum";
import { TASK_PRIORITY_LABELS } from "../../../db/label";
import { ActivityEntry, Project, StaffUser, Store, Task } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { findOrThrow } from "./core/lookup";
import {
  ChecklistProgress,
  TaskClock,
  TaskMove,
  checklistProgress,
  isAssignee,
  isTaskOpen,
  isTaskOverdue,
  taskClock,
  taskMoveBlocker,
  workLogBlocker,
} from "./rules/tasks";

// TASK MANAGEMENT. Any staff member gives a task to another (or to themselves);
// the assignee opens it (seen), starts it, logs the days and hours worked on it,
// ticks its checklist and hands it in; the giver accepts it or sends it back.
// Every move is logged, so the task's own page is its full history.

/** A list's filter: one status, or a cut across statuses. */
export type TaskView = TaskStatus | "open" | "unseen" | "overdue" | "all";

export type TaskFilters = {
  assigneeUuid?: string;
  assignedByUuid?: string;
  view?: TaskView;
  search?: string;
};

export type TaskRow = Pick<
  Task,
  | "uuid"
  | "number"
  | "title"
  | "priority"
  | "status"
  | "dueAt"
  | "createdAt"
  | "assignedAt"
  | "seenAt"
  | "startedAt"
  | "submittedAt"
  | "completedAt"
  | "assigneeUuid"
  | "assignedByUuid"
  | "returnedCount"
> & {
  assigneeName: StaffUser["name"];
  assignedByName: StaffUser["name"];
  projectCode: Project["code"] | null;
  clock: TaskClock;
  progress: ChecklistProgress;
  overdue: boolean;
};

export type TaskDetail = {
  task: Task;
  row: TaskRow;
  project: Pick<Project, "uuid" | "code" | "name"> | null;
  activity: ActivityEntry[];
};

/** One staff member's tasks, counted — the team workload screen. */
export type TaskWorkload = Pick<StaffUser, "uuid" | "name" | "role"> & {
  open: number;
  unseen: number;
  inProgress: number;
  onHold: number;
  inReview: number;
  overdue: number;
  done: number;
  /** Of the done ones, how many were accepted by their due date. */
  doneOnTime: number;
  /** Average working days of the done ones; null when none is done. */
  avgWorkingDays: number | null;
  loggedHours: number;
};

/** What the sidebar's "My tasks" badge counts. */
export type TaskCounts = {
  /** Open tasks given to me that I have not opened yet. */
  unseen: number;
  /** Tasks I gave that are handed in and wait for me. */
  toReview: number;
  /** All my open tasks. */
  open: number;
  /** Hours I logged on any task over the last `WORK_WEEK_DAYS` days, today included. */
  weekHours: number;
};

const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

export const WORK_WEEK_DAYS = 7;

const staffName = (store: Store, uuid: string): string => store.StaffUsers.find((u) => u.uuid === uuid)?.name ?? "Former staff";

export const toTaskRow = (store: Store, task: Task, now: string): TaskRow => ({
  uuid: task.uuid,
  number: task.number,
  title: task.title,
  priority: task.priority,
  status: task.status,
  dueAt: task.dueAt,
  createdAt: task.createdAt,
  assignedAt: task.assignedAt,
  seenAt: task.seenAt,
  startedAt: task.startedAt,
  submittedAt: task.submittedAt,
  completedAt: task.completedAt,
  assigneeUuid: task.assigneeUuid,
  assignedByUuid: task.assignedByUuid,
  returnedCount: task.returnedCount,
  assigneeName: staffName(store, task.assigneeUuid),
  assignedByName: staffName(store, task.assignedByUuid),
  projectCode: store.Projects.find((p) => p.uuid === task.projectUuid)?.code ?? null,
  clock: taskClock(task, now),
  progress: checklistProgress(task),
  overdue: isTaskOverdue(task, now),
});

const inView = (row: TaskRow, view: TaskView): boolean => {
  switch (view) {
    case "all":
      return true;
    case "open":
      return isTaskOpen(row);
    case "unseen":
      return isTaskOpen(row) && !row.seenAt;
    case "overdue":
      return row.overdue;
    default:
      return row.status === view;
  }
};

/** Open first, then the most urgent, then the soonest due. */
const byUrgency = (a: TaskRow, b: TaskRow): number =>
  Number(!isTaskOpen(a)) - Number(!isTaskOpen(b)) ||
  PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
  a.dueAt.localeCompare(b.dueAt);

export const listTasks = async (filters: TaskFilters = {}): Promise<TaskRow[]> => {
  const store = readStore();
  const now = nowIso();
  const search = filters.search?.trim().toLowerCase();
  return store.Tasks.filter(
    (t) =>
      (!filters.assigneeUuid || t.assigneeUuid === filters.assigneeUuid) &&
      (!filters.assignedByUuid || t.assignedByUuid === filters.assignedByUuid),
  )
    .map((t) => toTaskRow(store, t, now))
    .filter((r) => inView(r, filters.view ?? "all"))
    .filter((r) => !search || [r.number, r.title, r.assigneeName, r.assignedByName, r.projectCode ?? ""].some((v) => v.toLowerCase().includes(search)))
    .sort(byUrgency);
};

export const getTask = async (uuid: string): Promise<TaskDetail> => {
  const store = readStore();
  const task = findOrThrow(store.Tasks, uuid, "Task");
  const project = store.Projects.find((p) => p.uuid === task.projectUuid);
  return {
    task,
    row: toTaskRow(store, task, nowIso()),
    project: project ? { uuid: project.uuid, code: project.code, name: project.name } : null,
    activity: store.Activity.filter((a) => a.entity === "task" && a.entityUuid === uuid),
  };
};

/** Everyone a task can be given to. */
export const listTaskAssignees = async (): Promise<{ value: string; label: string }[]> =>
  readStore().StaffUsers.map((u) => ({ value: u.uuid, label: u.name }));

export const taskCountsFor = async (staffUuid: string): Promise<TaskCounts> => {
  const store = readStore();
  const now = nowIso();
  const name = staffName(store, staffUuid);
  const mine = store.Tasks.filter((t) => t.assigneeUuid === staffUuid && isTaskOpen(t));
  const recent = store.Tasks.flatMap((t) => t.workLogs).filter((l) => l.by === name && calendarDaysBetween(l.date, now) < WORK_WEEK_DAYS);
  return {
    unseen: mine.filter((t) => !t.seenAt).length,
    toReview: store.Tasks.filter((t) => t.assignedByUuid === staffUuid && t.status === "in_review").length,
    open: mine.length,
    weekHours: round2(sumBy(recent, (l) => l.hours)),
  };
};

/** Every staff member's tasks, counted; the busiest first. */
export const taskWorkload = (store: Store, now: string): TaskWorkload[] =>
  store.StaffUsers.map((user) => {
    const rows = store.Tasks.filter((t) => t.assigneeUuid === user.uuid).map((t) => toTaskRow(store, t, now));
    const open = rows.filter((r) => isTaskOpen(r));
    const done = rows.filter((r) => r.status === "done");
    const worked = done.flatMap((r) => (r.clock.workingDays === null ? [] : [r.clock.workingDays]));
    return {
      uuid: user.uuid,
      name: user.name,
      role: user.role,
      open: open.length,
      unseen: open.filter((r) => !r.seenAt).length,
      inProgress: rows.filter((r) => r.status === "in_progress").length,
      onHold: rows.filter((r) => r.status === "on_hold").length,
      inReview: rows.filter((r) => r.status === "in_review").length,
      overdue: rows.filter((r) => r.overdue).length,
      done: done.length,
      doneOnTime: done.filter((r) => r.clock.lateDays === 0).length,
      avgWorkingDays: worked.length ? round2(sumBy(worked, (d) => d) / worked.length) : null,
      loggedHours: round2(sumBy(rows, (r) => r.clock.loggedHours)),
    };
  }).sort((a, b) => b.open - a.open || b.done - a.done);

export const listTaskWorkload = async (): Promise<TaskWorkload[]> => taskWorkload(readStore(), nowIso());

/** Give a task. Given to oneself, it counts as seen at once. */
export const createTask = async (actor: Actor, input: TaskInput): Promise<Task> => {
  const now = nowIso();
  const dueAt = toIso(input.dueDate);
  if (calendarDaysBetween(now, dueAt) < 0) {
    throw new Error("The due date has already passed");
  }
  return transact((store) => {
    const assignee = findOrThrow(store.StaffUsers, input.assigneeUuid, "Staff member");
    if (input.projectUuid) {
      findOrThrow(store.Projects, input.projectUuid, "Project");
    }
    const task: Task = {
      uuid: generateUuid(),
      number: nextDocumentNumber("TSK", store.Tasks.map((t) => t.number)),
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: "todo",
      assigneeUuid: assignee.uuid,
      assignedByUuid: actor.uuid,
      projectUuid: input.projectUuid || undefined,
      dueAt,
      createdAt: now,
      assignedAt: now,
      seenAt: assignee.uuid === actor.uuid ? now : undefined,
      returnedCount: 0,
      checklist: input.checklist.filter((i) => i.text).map((i) => ({ uuid: generateUuid(), text: i.text })),
      workLogs: [],
      comments: [],
    };
    store.Tasks.push(task);
    logActivity(store, {
      actorName: actor.name,
      entity: "task",
      entityUuid: task.uuid,
      entityLabel: task.number,
      action: `Task given to ${assignee.name}`,
      detail: `${task.title} — ${TASK_PRIORITY_LABELS[task.priority]} priority, due ${formatDate(dueAt)}`,
    });
    return task;
  });
};

/**
 * The assignee opened the task. Only their first visit is recorded — anyone
 * else's, and every later one, changes nothing. True when it was recorded.
 */
export const markTaskSeen = async (actor: Actor, uuid: string): Promise<boolean> =>
  transact((store) => {
    const task = findOrThrow(store.Tasks, uuid, "Task");
    if (!isAssignee(task, actor) || task.seenAt) {
      return false;
    }
    task.seenAt = nowIso();
    logActivity(store, { actorName: actor.name, entity: "task", entityUuid: task.uuid, entityLabel: task.number, action: "Seen by the assignee" });
    return true;
  });

/** Holding, sending back and cancelling always say why. */
const requireReason = (note: string): string => {
  if (!note.trim()) {
    throw new Error("Write the reason");
  }
  return note.trim();
};

/** One move on a task: the rule is re-checked, the change applied and logged together. */
const moveTask = async (
  actor: Actor,
  uuid: string,
  move: TaskMove,
  apply: (task: Task, store: Store, now: string) => { action: string; detail?: string },
): Promise<Task> =>
  transact((store) => {
    const task = findOrThrow(store.Tasks, uuid, "Task");
    const blocker = taskMoveBlocker(task, actor, move);
    if (blocker) {
      throw new Error(blocker);
    }
    const { action, detail } = apply(task, store, nowIso());
    logActivity(store, { actorName: actor.name, entity: "task", entityUuid: task.uuid, entityLabel: task.number, action, detail });
    return task;
  });

export const startTask = (actor: Actor, uuid: string): Promise<Task> =>
  moveTask(actor, uuid, "start", (task, _store, now) => {
    task.status = "in_progress";
    task.startedAt = now;
    task.seenAt = task.seenAt ?? now;
    return { action: "Work started" };
  });

export const holdTask = (actor: Actor, uuid: string, input: TaskReasonInput): Promise<Task> =>
  moveTask(actor, uuid, "hold", (task) => {
    task.status = "on_hold";
    task.reason = requireReason(input.note);
    return { action: "Put on hold", detail: task.reason };
  });

export const resumeTask = (actor: Actor, uuid: string): Promise<Task> =>
  moveTask(actor, uuid, "resume", (task) => {
    task.status = "in_progress";
    task.reason = undefined;
    return { action: "Work resumed" };
  });

export const submitTask = (actor: Actor, uuid: string, input: TaskNoteInput): Promise<Task> =>
  moveTask(actor, uuid, "submit", (task, _store, now) => {
    task.status = "in_review";
    task.submittedAt = now;
    task.reason = undefined;
    return { action: "Handed in as finished", detail: input.note };
  });

export const approveTask = (actor: Actor, uuid: string, input: TaskNoteInput): Promise<Task> =>
  moveTask(actor, uuid, "approve", (task, _store, now) => {
    task.status = "done";
    task.completedAt = now;
    const { workingDays, lateDays } = taskClock(task, now);
    const took = `Took ${workingDays ?? 0} day(s)${lateDays > 0 ? `, ${lateDays} day(s) late` : ", on time"}`;
    return { action: "Accepted as done", detail: input.note ? `${took} — ${input.note}` : took };
  });

export const returnTask = (actor: Actor, uuid: string, input: TaskReasonInput): Promise<Task> =>
  moveTask(actor, uuid, "return", (task) => {
    task.reason = requireReason(input.note);
    task.status = "in_progress";
    task.submittedAt = undefined;
    task.returnedCount += 1;
    return { action: "Sent back for more work", detail: task.reason };
  });

export const cancelTask = (actor: Actor, uuid: string, input: TaskReasonInput): Promise<Task> =>
  moveTask(actor, uuid, "cancel", (task, _store, now) => {
    task.reason = requireReason(input.note);
    task.status = "cancelled";
    task.cancelledAt = now;
    return { action: "Task cancelled", detail: task.reason };
  });

/** A new assignee starts afresh: not seen, not started. The work logged so far stays, under its author's name. */
export const reassignTask = (actor: Actor, uuid: string, input: TaskReassignInput): Promise<Task> =>
  moveTask(actor, uuid, "reassign", (task, store, now) => {
    const next = findOrThrow(store.StaffUsers, input.assigneeUuid, "Staff member");
    if (next.uuid === task.assigneeUuid) {
      throw new Error("The task is already assigned to them");
    }
    const from = staffName(store, task.assigneeUuid);
    task.assigneeUuid = next.uuid;
    task.assignedAt = now;
    task.seenAt = next.uuid === actor.uuid ? now : undefined;
    task.startedAt = undefined;
    task.status = "todo";
    task.reason = undefined;
    return { action: `Reassigned from ${from} to ${next.name}`, detail: input.note };
  });

export const logTaskWork = (actor: Actor, uuid: string, input: TaskWorkLogInput): Promise<Task> =>
  moveTask(actor, uuid, "log_work", (task, _store, now) => {
    const date = toIso(input.date);
    const blocker = workLogBlocker(task, { date, hours: input.hours }, now);
    if (blocker) {
      throw new Error(blocker);
    }
    task.workLogs.push({ uuid: generateUuid(), date, hours: round2(input.hours), note: input.note || undefined, by: actor.name, at: now });
    return { action: `Logged ${round2(input.hours)} hour(s) for ${formatDate(date)}`, detail: input.note };
  });

export const toggleTaskChecklistItem = (actor: Actor, uuid: string, itemUuid: string): Promise<Task> =>
  moveTask(actor, uuid, "tick", (task, _store, now) => {
    const item = findOrThrow(task.checklist, itemUuid, "Checklist item");
    item.doneAt = item.doneAt ? undefined : now;
    item.doneBy = item.doneAt ? actor.name : undefined;
    return { action: item.doneAt ? "Checklist item done" : "Checklist item reopened", detail: item.text };
  });

export const addTaskChecklistItem = (actor: Actor, uuid: string, input: TaskChecklistItemInput): Promise<Task> =>
  moveTask(actor, uuid, "add_item", (task) => {
    task.checklist.push({ uuid: generateUuid(), text: input.text });
    return { action: "Checklist item added", detail: input.text };
  });

/** Anyone may comment, on an open or a closed task. */
export const commentOnTask = async (actor: Actor, uuid: string, input: TaskCommentInput): Promise<Task> =>
  transact((store) => {
    const task = findOrThrow(store.Tasks, uuid, "Task");
    task.comments.push({ uuid: generateUuid(), at: nowIso(), by: actor.name, text: input.text });
    logActivity(store, { actorName: actor.name, entity: "task", entityUuid: task.uuid, entityLabel: task.number, action: "Comment added", detail: input.text });
    return task;
  });
