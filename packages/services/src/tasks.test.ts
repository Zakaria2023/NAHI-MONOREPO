import { beforeEach, describe, expect, it } from "vitest";
import { addDays, nowIso } from "utils";
import { readStore, resetStore } from "../../../db";
import { StaffRole } from "../../../db/enum";
import { Task } from "../../../db/types";
import { Actor } from "./core/actor";
import { taskClock, taskMoveBlocker, workLogBlocker } from "./rules/tasks";
import {
  addTaskChecklistItem,
  approveTask,
  cancelTask,
  createTask,
  getTask,
  holdTask,
  listTaskWorkload,
  logTaskWork,
  markTaskSeen,
  reassignTask,
  resumeTask,
  returnTask,
  startTask,
  submitTask,
  taskCountsFor,
  toggleTaskChecklistItem,
} from "./tasks";

const as = (role: StaffRole): Actor => {
  const user = readStore().StaffUsers.find((u) => u.role === role);
  if (!user) {
    throw new Error(`no ${role}`);
  }
  return { uuid: user.uuid, name: user.name, role };
};

const today = () => nowIso().slice(0, 10);
const dayFromNow = (days: number) => addDays(nowIso(), days).slice(0, 10);

const giveTask = (checklist: string[] = []) =>
  createTask(as("projects_manager"), {
    title: "Chase the permit",
    description: "",
    assigneeUuid: as("project_engineer").uuid,
    priority: "high",
    dueDate: dayFromNow(3),
    projectUuid: "",
    checklist: checklist.map((text) => ({ text })),
  });

const stored = (uuid: string): Task => {
  const task = readStore().Tasks.find((t) => t.uuid === uuid);
  if (!task) {
    throw new Error("task gone");
  }
  return task;
};

beforeEach(() => resetStore());

describe("giving a task", () => {
  it("numbers it, leaves it unseen and logs who gave it to whom", async () => {
    const task = await giveTask();
    expect(task).toMatchObject({ status: "todo", seenAt: undefined, returnedCount: 0 });
    expect(task.number).toMatch(/^TSK-\d{4}$/);
    expect(readStore().Activity[0]).toMatchObject({ entity: "task", entityUuid: task.uuid, action: expect.stringMatching(/given to/) });
  });

  it("refuses a due date that has already passed", async () => {
    await expect(
      createTask(as("projects_manager"), {
        title: "Late already",
        description: "",
        assigneeUuid: as("project_engineer").uuid,
        priority: "normal",
        dueDate: dayFromNow(-1),
        projectUuid: "",
        checklist: [],
      }),
    ).rejects.toThrow(/already passed/);
  });

  it("counts a task given to oneself as seen", async () => {
    const pm = as("project_manager");
    const task = await createTask(pm, { title: "Note to self", description: "", assigneeUuid: pm.uuid, priority: "low", dueDate: today(), projectUuid: "", checklist: [] });
    expect(task.seenAt).toBeDefined();
  });
});

describe("seen", () => {
  it("is recorded only when the assignee opens it, and only the first time", async () => {
    const task = await giveTask();
    expect(await markTaskSeen(as("projects_manager"), task.uuid)).toBe(false);
    expect(stored(task.uuid).seenAt).toBeUndefined();
    expect(await markTaskSeen(as("project_engineer"), task.uuid)).toBe(true);
    const seenAt = stored(task.uuid).seenAt;
    expect(seenAt).toBeDefined();
    expect(await markTaskSeen(as("project_engineer"), task.uuid)).toBe(false);
    expect(stored(task.uuid).seenAt).toBe(seenAt);
  });

  it("is counted in the assignee's badge until opened", async () => {
    const engineer = as("project_engineer");
    const before = (await taskCountsFor(engineer)).unseen;
    const task = await giveTask();
    expect((await taskCountsFor(engineer)).unseen).toBe(before + 1);
    await markTaskSeen(engineer, task.uuid);
    expect((await taskCountsFor(engineer)).unseen).toBe(before);
  });
});

describe("who moves a task", () => {
  it("lets only the assignee start, log work and hand it in", async () => {
    const task = await giveTask();
    await expect(startTask(as("projects_manager"), task.uuid)).rejects.toThrow(/assigned to/);
    await startTask(as("project_engineer"), task.uuid);
    await expect(logTaskWork(as("projects_manager"), task.uuid, { date: today(), hours: 2 })).rejects.toThrow(/assigned to/);
  });

  it("lets only the giver accept, send back or cancel", async () => {
    const engineer = as("project_engineer");
    const task = await giveTask();
    await startTask(engineer, task.uuid);
    await logTaskWork(engineer, task.uuid, { date: today(), hours: 3 });
    await submitTask(engineer, task.uuid, {});
    await expect(approveTask(engineer, task.uuid, {})).rejects.toThrow(/gave the task/);
    await expect(cancelTask(as("accountant"), task.uuid, { note: "no" })).rejects.toThrow(/gave the task/);
    await approveTask(as("projects_manager"), task.uuid, {});
    expect(stored(task.uuid).status).toBe("done");
  });

  it("starting a task marks it seen", async () => {
    const task = await giveTask();
    await startTask(as("project_engineer"), task.uuid);
    expect(stored(task.uuid).seenAt).toBeDefined();
  });
});

describe("finishing", () => {
  it("cannot be handed in with an open checklist item", async () => {
    const engineer = as("project_engineer");
    const task = await giveTask(["Call the office", "Upload the permit"]);
    await startTask(engineer, task.uuid);
    await logTaskWork(engineer, task.uuid, { date: today(), hours: 4 });
    await expect(submitTask(engineer, task.uuid, {})).rejects.toThrow(/2 open checklist/);
    for (const item of stored(task.uuid).checklist) {
      await toggleTaskChecklistItem(engineer, task.uuid, item.uuid);
    }
    await submitTask(engineer, task.uuid, {});
    expect(stored(task.uuid).status).toBe("in_review");
  });

  it("cannot be handed in with no work logged", async () => {
    const engineer = as("project_engineer");
    const task = await giveTask();
    await startTask(engineer, task.uuid);
    await expect(submitTask(engineer, task.uuid, {})).rejects.toThrow(/Log the work/);
  });

  it("sent back, it returns to work with the reason, and counts the return", async () => {
    const engineer = as("project_engineer");
    const task = await giveTask();
    await startTask(engineer, task.uuid);
    await logTaskWork(engineer, task.uuid, { date: today(), hours: 1 });
    await submitTask(engineer, task.uuid, {});
    await expect(returnTask(as("projects_manager"), task.uuid, { note: " " })).rejects.toThrow(/reason/);
    await returnTask(as("projects_manager"), task.uuid, { note: "Photos missing" });
    expect(stored(task.uuid)).toMatchObject({ status: "in_progress", returnedCount: 1 });
  });

  it("closed, it takes no more moves", async () => {
    const task = await giveTask();
    await cancelTask(as("projects_manager"), task.uuid, { note: "Not needed" });
    await expect(startTask(as("project_engineer"), task.uuid)).rejects.toThrow(/cancelled/);
    await expect(addTaskChecklistItem(as("projects_manager"), task.uuid, { text: "x" })).rejects.toThrow(/cancelled/);
  });
});

describe("on hold", () => {
  it("stops work logging until resumed", async () => {
    const engineer = as("project_engineer");
    const task = await giveTask();
    await startTask(engineer, task.uuid);
    await holdTask(engineer, task.uuid, { note: "Waiting for photos" });
    await expect(logTaskWork(engineer, task.uuid, { date: today(), hours: 1 })).rejects.toThrow(/Resume/);
    await resumeTask(engineer, task.uuid);
    await logTaskWork(engineer, task.uuid, { date: today(), hours: 1 });
    expect(stored(task.uuid).workLogs).toHaveLength(1);
  });
});

describe("work log", () => {
  it("refuses more than 24 hours in a day, a future day and a day before the start", async () => {
    const engineer = as("project_engineer");
    const task = await giveTask();
    await startTask(engineer, task.uuid);
    await logTaskWork(engineer, task.uuid, { date: today(), hours: 20 });
    await expect(logTaskWork(engineer, task.uuid, { date: today(), hours: 5 })).rejects.toThrow(/no more than 24/);
    await expect(logTaskWork(engineer, task.uuid, { date: dayFromNow(2), hours: 1 })).rejects.toThrow(/not come/);
    await expect(logTaskWork(engineer, task.uuid, { date: dayFromNow(-3), hours: 1 })).rejects.toThrow(/before the task was started/);
  });

  it("the rule alone: hours must be positive", () => {
    const task = stored(readStore().Tasks[0].uuid);
    expect(workLogBlocker(task, { date: nowIso(), hours: 0 }, nowIso())).toMatch(/hours/);
  });
});

describe("reassigning", () => {
  it("starts afresh for the new assignee: unseen and not started", async () => {
    const engineer = as("project_engineer");
    const task = await giveTask();
    await startTask(engineer, task.uuid);
    await reassignTask(as("projects_manager"), task.uuid, { assigneeUuid: as("project_manager").uuid });
    expect(stored(task.uuid)).toMatchObject({ status: "todo", seenAt: undefined, startedAt: undefined, assigneeUuid: as("project_manager").uuid });
    await expect(startTask(engineer, task.uuid)).rejects.toThrow(/assigned to/);
  });
});

describe("the day counts", () => {
  const base: Task = {
    uuid: "t",
    number: "TSK-9999",
    title: "t",
    description: "",
    priority: "normal",
    status: "in_progress",
    assigneeUuid: "a",
    assignedByUuid: "b",
    dueAt: "2026-10-05T00:00:00.000Z",
    createdAt: "2026-09-28T08:00:00.000Z",
    assignedAt: "2026-09-28T08:00:00.000Z",
    seenAt: "2026-09-28T11:00:00.000Z",
    startedAt: "2026-09-29T09:00:00.000Z",
    returnedCount: 0,
    checklist: [],
    workLogs: [
      { uuid: "1", date: "2026-09-29T00:00:00.000Z", hours: 3, by: "a", at: "" },
      { uuid: "2", date: "2026-09-29T00:00:00.000Z", hours: 2, by: "a", at: "" },
      { uuid: "3", date: "2026-10-01T00:00:00.000Z", hours: 4, by: "a", at: "" },
    ],
    comments: [],
  };

  it("counts working days from the start day to today, both included, and the logged days apart", () => {
    const clock = taskClock(base, "2026-10-03T07:00:00.000Z");
    expect(clock).toMatchObject({ workingDays: 5, loggedDays: 2, loggedHours: 9, seenAfterHours: 3, assignedDays: 5, dueInDays: 2, lateDays: 0 });
  });

  it("stops the working days when it is finished, and says how late it was", () => {
    const done: Task = { ...base, status: "done", completedAt: "2026-10-07T10:00:00.000Z" };
    expect(taskClock(done, "2026-10-20T00:00:00.000Z")).toMatchObject({ workingDays: 9, lateDays: 2, dueInDays: null });
  });

  it("counts an open task past its due date as late", () => {
    expect(taskClock(base, "2026-10-08T00:00:00.000Z").lateDays).toBe(3);
  });

  it("has no working days before it starts", () => {
    expect(taskClock({ ...base, status: "todo", startedAt: undefined }, "2026-10-03T00:00:00.000Z").workingDays).toBeNull();
  });

  it("names the reason a move is blocked", () => {
    expect(taskMoveBlocker({ ...base, status: "todo" }, { uuid: "a", name: "A", role: "accountant" }, "submit")).toMatch(/in progress/);
  });
});

describe("demo data", () => {
  it("has tasks in every state and a workload per assignee", async () => {
    const statuses = new Set(readStore().Tasks.map((t) => t.status));
    expect([...statuses].sort()).toEqual(["cancelled", "done", "in_progress", "in_review", "on_hold", "todo"]);
    const workload = await listTaskWorkload();
    expect(workload.some((w) => w.overdue > 0)).toBe(true);
    expect(workload.some((w) => w.unseen > 0)).toBe(true);
    const detail = await getTask(readStore().Tasks[0].uuid);
    expect(detail.activity.length).toBeGreaterThan(0);
  });
});
