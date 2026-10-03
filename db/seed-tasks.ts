import { addDays, addHours, generateUuid } from "utils";
import { Operator, StaffRole, TaskPriority, TaskStatus } from "./enum";
import { Store, Task, TaskChecklistItem, TaskComment, TaskWorkLog } from "./types";

// DEMO TASKS: one for each state a task can be in — not yet seen, seen and not
// started, in progress, overdue, on hold, handed in, sent back, done on time,
// done late, cancelled — spread over the staff so the team workload has figures.

/** A staff role, or the name of an employee with an Employee account. */
type Who = StaffRole | (string & {});

type TaskDraft = {
  title: string;
  description: string;
  from: Who;
  to: Who;
  priority: TaskPriority;
  status: TaskStatus;
  operator?: Operator;
  /** Days ago it was given. */
  given: number;
  /** Days from now it is due — negative when already past. */
  due: number;
  /** Hours after it was given that the assignee opened it; absent while unseen. */
  seenAfter?: number;
  /** Days ago work started. */
  started?: number;
  submitted?: number;
  completed?: number;
  cancelled?: number;
  reason?: string;
  returned?: number;
  /** Checklist lines; the first `ticked` are done. */
  checklist?: string[];
  ticked?: number;
  /** [days ago, hours, note] for each day of work logged. */
  logs?: [number, number, string?][];
  /** [days ago, who, text]. */
  comments?: [number, Who, string][];
};

export const addTaskDemoData = (store: Store, now: string): void => {
  const ago = (days: number): string => addDays(now, -days);
  const staff = (who: Who) => {
    const user = store.StaffUsers.find((u) => u.role === who) ?? store.StaffUsers.find((u) => u.name === who);
    if (!user) {
      throw new Error(`Task seed is missing ${who}`);
    }
    return user;
  };
  const projectOf = (operator?: Operator): string | undefined => store.Projects.find((p) => p.operator === operator)?.uuid;

  const drafts: TaskDraft[] = [
    {
      title: "Chase the Baladiyah permit for the Olaya site",
      description: "The permit request was filed last week. Follow it up daily until it is issued and upload the permit to the project.",
      from: "projects_manager",
      to: "project_manager",
      priority: "high",
      status: "in_progress",
      operator: "mobily",
      given: 5,
      due: 3,
      seenAfter: 2,
      started: 4,
      checklist: ["Call the Baladiyah office", "Send the missing drawings", "Upload the issued permit"],
      ticked: 2,
      logs: [[4, 3, "Visited the Baladiyah office"], [3, 5, "Drawings re-sent"], [1, 2]],
      comments: [[3, "projects_manager", "Any date from them yet?"], [2, "project_manager", "They promised it by Thursday."]],
    },
    {
      title: "Prepare the as-built drawings for STC",
      description: "As-built for every site of the order, in STC's template, ready for the M4 submission.",
      from: "project_manager",
      to: "project_engineer",
      priority: "urgent",
      status: "in_progress",
      operator: "stc",
      given: 9,
      due: -2,
      seenAfter: 20,
      started: 8,
      checklist: ["Collect the site measurements", "Draw in STC's template", "Get the PM's sign-off", "Upload to the project"],
      ticked: 1,
      logs: [[8, 6], [7, 7, "Measurements done"], [5, 4], [2, 8, "Template half done"]],
      comments: [[1, "project_manager", "This is now late — what is left?"]],
    },
    {
      title: "Reconcile the Al Rajhi account for last month",
      description: "Match the bank statement against the payments and collections, and record the reconciliation.",
      from: "finance_manager",
      to: "region_accountant",
      priority: "normal",
      status: "todo",
      given: 1,
      due: 5,
    },
    {
      title: "Assign an inspector for the PAT",
      description: "The STC site is ready for its PAT; pick the inspector and book the date with the customer.",
      from: "projects_manager",
      to: "region_project_manager",
      priority: "high",
      status: "todo",
      operator: "stc",
      given: 2,
      due: 1,
      seenAfter: 5,
    },
    {
      title: "Count the cable drums in the Riyadh warehouse",
      description: "A spot count of every cable drum against the stock balance before the month closes.",
      from: "procurement",
      to: "warehouse_keeper",
      priority: "normal",
      status: "in_review",
      given: 6,
      due: 1,
      seenAfter: 1,
      started: 5,
      submitted: 1,
      checklist: ["Count the 24-core drums", "Count the 48-core drums", "Note any damaged drum"],
      ticked: 3,
      logs: [[5, 4], [4, 6, "48-core done"], [2, 3, "Two drums damaged, photographed"]],
    },
    {
      title: "Get three quotations for splice closures",
      description: "For PR-0002: three suppliers, same specification, delivery to Riyadh.",
      from: "direct_manager",
      to: "procurement",
      priority: "normal",
      status: "done",
      given: 20,
      due: -12,
      seenAfter: 1,
      started: 19,
      submitted: 15,
      completed: 14,
      checklist: ["Najd Civil Supplies", "Gulf Fiber Trading", "Third supplier"],
      ticked: 3,
      logs: [[19, 2], [17, 3], [16, 2, "All three received"]],
    },
    {
      title: "Register the supplier invoices received this week",
      description: "Every invoice with its PO and receipt, so the three-way match runs before payment.",
      from: "finance_manager",
      to: "accountant",
      priority: "high",
      status: "done",
      given: 18,
      due: -10,
      seenAfter: 3,
      started: 17,
      submitted: 8,
      completed: 7,
      returned: 1,
      logs: [[17, 5], [15, 6], [12, 4], [9, 3, "Fixed the VAT on two invoices"]],
      comments: [[10, "finance_manager", "Sent back: two invoices carry the wrong VAT amount."], [8, "accountant", "Corrected and handed in again."]],
    },
    {
      title: "Weekly site safety report",
      description: "The safety checklist for every active site, with photos.",
      from: "operations_manager",
      to: "project_manager",
      priority: "low",
      status: "on_hold",
      given: 4,
      due: 4,
      seenAfter: 4,
      started: 3,
      reason: "Waiting for the safety officer's photos from the sites",
      logs: [[3, 2]],
    },
    {
      title: "Review the Q4 project budgets",
      description: "Go over every open project's budget against actual and propose revisions before the quarter starts.",
      from: "deputy_gm",
      to: "projects_manager",
      priority: "high",
      status: "todo",
      given: 3,
      due: 10,
    },
    {
      title: "Update the tracking board for the Mobily POs",
      description: "Make sure every Mobily project shows its real stage and what is missing.",
      from: "project_manager",
      to: "project_manager",
      priority: "normal",
      status: "in_progress",
      operator: "mobily",
      given: 2,
      due: 2,
      seenAfter: 0,
      started: 1,
      logs: [[1, 2]],
    },
    {
      title: "Archive the old delivery notes",
      description: "Scan and file last year's delivery notes.",
      from: "system_admin",
      to: "warehouse_keeper",
      priority: "low",
      status: "cancelled",
      given: 12,
      due: 3,
      seenAfter: 6,
      cancelled: 2,
      reason: "The scanning is now done by the document centre",
    },
    {
      title: "Close the remedy items on the Mobily site",
      description: "Every item on the remedy list fixed, with before and after photos.",
      from: "region_project_manager",
      to: "project_engineer",
      priority: "urgent",
      status: "in_review",
      operator: "mobily",
      given: 7,
      due: 0,
      seenAfter: 2,
      started: 6,
      submitted: 0,
      returned: 1,
      checklist: ["Re-seal the manhole covers", "Re-instate the asphalt", "Photos before and after"],
      ticked: 3,
      logs: [[6, 6], [5, 8], [3, 5], [0, 3, "Photos added"]],
      comments: [[3, "region_project_manager", "Sent back: the asphalt photos are missing."]],
    },
    {
      title: "Collect the lab test results",
      description: "Get the compaction test results from the laboratory and attach them to the project.",
      from: "projects_manager",
      to: "project_engineer",
      priority: "high",
      status: "todo",
      operator: "mobily",
      given: 6,
      due: -1,
    },
    {
      title: "File the VAT return",
      description: "Prepare and file the return for last month.",
      from: "finance_manager",
      to: "region_accountant",
      priority: "high",
      status: "done",
      given: 25,
      due: -18,
      seenAfter: 2,
      started: 24,
      submitted: 21,
      completed: 20,
      logs: [[24, 4], [22, 5]],
    },
    // The employee accounts' own work: what an employee sees in My tasks.
    {
      title: "Supervise the cabinet installation at the Hittin site",
      description: "Be on site for the cabinet delivery and installation; check the plinth and the earthing before sign-off.",
      from: "project_manager",
      to: "Bandar Al-Qahtani",
      priority: "high",
      status: "todo",
      operator: "stc",
      given: 0,
      due: 3,
      checklist: ["Check the plinth", "Check the earthing", "Photos of the installed cabinet"],
    },
    {
      title: "Daily safety walk on the Exit 15 backbone",
      description: "Walk the open trench every morning and record anything unsafe.",
      from: "operations_manager",
      to: "Bandar Al-Qahtani",
      priority: "normal",
      status: "in_progress",
      operator: "stc",
      given: 4,
      due: 6,
      seenAfter: 1,
      started: 3,
      checklist: ["Barriers in place", "Signage in place", "Trench shoring checked"],
      ticked: 1,
      logs: [[3, 2, "Two barriers replaced"], [2, 1.5], [1, 2]],
      comments: [[2, "operations_manager", "Send the photos with the end-of-week report."]],
    },
    {
      title: "Return the spare splicing kit to the warehouse",
      description: "The spare kit from the Olaya job goes back to WH-RUH.",
      from: "warehouse_keeper",
      to: "Bandar Al-Qahtani",
      priority: "low",
      status: "done",
      given: 10,
      due: -6,
      seenAfter: 2,
      started: 9,
      submitted: 8,
      completed: 8,
      logs: [[9, 1]],
    },
    {
      title: "Splice the 48-core joint at manhole MH-12",
      description: "Splice and test the joint; record the OTDR trace.",
      from: "project_engineer",
      to: "Mohammed Rafiq",
      priority: "urgent",
      status: "todo",
      operator: "mobily",
      given: 1,
      due: 1,
      checklist: ["Splice", "OTDR test", "Close the joint"],
    },
  ];

  store.Tasks = drafts.map((d, index): Task => {
    const createdAt = ago(d.given);
    const checklist: TaskChecklistItem[] = (d.checklist ?? []).map((text, i) => ({
      uuid: generateUuid(),
      text,
      doneAt: i < (d.ticked ?? 0) ? ago(Math.max(0, (d.submitted ?? 1) + 0.5)) : undefined,
      doneBy: i < (d.ticked ?? 0) ? staff(d.to).name : undefined,
    }));
    const workLogs: TaskWorkLog[] = (d.logs ?? []).map(([days, hours, note]) => ({
      uuid: generateUuid(),
      date: `${ago(days).slice(0, 10)}T00:00:00.000Z`,
      hours,
      note,
      by: staff(d.to).name,
      at: ago(days),
    }));
    const comments: TaskComment[] = (d.comments ?? []).map(([days, role, text]) => ({
      uuid: generateUuid(),
      at: ago(days),
      by: staff(role).name,
      text,
    }));
    return {
      uuid: generateUuid(),
      number: `TSK-${String(index + 1).padStart(4, "0")}`,
      title: d.title,
      description: d.description,
      priority: d.priority,
      status: d.status,
      assigneeUuid: staff(d.to).uuid,
      assignedByUuid: staff(d.from).uuid,
      projectUuid: projectOf(d.operator),
      dueAt: `${addDays(now, d.due).slice(0, 10)}T00:00:00.000Z`,
      createdAt,
      assignedAt: createdAt,
      seenAt: d.seenAfter === undefined ? undefined : addHours(createdAt, d.seenAfter),
      startedAt: d.started === undefined ? undefined : ago(d.started),
      submittedAt: d.submitted === undefined ? undefined : ago(d.submitted),
      completedAt: d.completed === undefined ? undefined : ago(d.completed),
      cancelledAt: d.cancelled === undefined ? undefined : ago(d.cancelled),
      reason: d.reason,
      returnedCount: d.returned ?? 0,
      checklist,
      workLogs,
      comments,
    };
  });
};
