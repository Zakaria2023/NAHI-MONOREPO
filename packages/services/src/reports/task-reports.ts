import { round2 } from "utils";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "../../../../db/label";
import { Store } from "../../../../db/types";
import { taskWorkload, toTaskRow } from "../tasks";
import { ReportData, ReportParams, col } from "./report";

// TASK REPORTS: how each employee's tasks went, and every task with its days.

export const taskPerformance = (store: Store, _params: ReportParams, now: string): ReportData => {
  const rows = taskWorkload(store, now).filter((w) => w.open + w.done > 0);
  return {
    note: "Working days run from the day work started to the day the task was handed in or accepted, both days counted.",
    columns: [
      col("name", "Employee"),
      col("open", "Open", "number"),
      col("unseen", "Not seen", "number"),
      col("overdue", "Overdue", "number"),
      col("inReview", "Waiting review", "number"),
      col("done", "Done", "number"),
      col("onTime", "Done on time", "percent"),
      col("avgDays", "Avg working days", "number"),
      col("hours", "Hours logged", "number"),
    ],
    rows: rows.map((w) => ({
      key: w.uuid,
      href: `/tasks?assignee=${w.uuid}`,
      cells: {
        name: w.name,
        open: w.open,
        unseen: w.unseen,
        overdue: w.overdue,
        inReview: w.inReview,
        done: w.done,
        onTime: w.done ? round2((w.doneOnTime / w.done) * 100) : null,
        avgDays: w.avgWorkingDays,
        hours: w.loggedHours,
      },
    })),
  };
};

export const taskRegister = (store: Store, _params: ReportParams, now: string): ReportData => ({
  columns: [
    col("number", "Task"),
    col("title", "Title", "text", true),
    col("assignee", "Assigned to"),
    col("by", "Given by"),
    col("priority", "Priority"),
    col("status", "Status"),
    col("assigned", "Given", "date"),
    col("seen", "Seen", "date"),
    col("started", "Started", "date"),
    col("due", "Due", "date"),
    col("finished", "Finished", "date"),
    col("days", "Working days", "number"),
    col("hours", "Hours", "number"),
    col("late", "Days late", "number"),
  ],
  rows: store.Tasks.map((t) => toTaskRow(store, t, now))
    .sort((a, b) => b.number.localeCompare(a.number))
    .map((r) => ({
      key: r.uuid,
      href: `/tasks/${r.uuid}`,
      cells: {
        number: r.number,
        title: r.title,
        assignee: r.assigneeName,
        by: r.assignedByName,
        priority: TASK_PRIORITY_LABELS[r.priority],
        status: TASK_STATUS_LABELS[r.status],
        assigned: r.assignedAt,
        seen: r.seenAt ?? null,
        started: r.startedAt ?? null,
        due: r.dueAt,
        finished: r.completedAt ?? null,
        days: r.clock.workingDays,
        hours: r.clock.loggedHours,
        late: r.clock.lateDays,
      },
    })),
});
