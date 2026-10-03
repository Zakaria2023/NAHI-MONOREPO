# Task management

Not one of the four specification documents: added so managers can give work to
employees and see whether it was seen, how long it has been worked on, and whether it
is finished. The rules live in `packages/services/src/rules/tasks.ts`, each with a test
in `packages/services/src/tasks.test.ts`.

## The cycle

1. **Given** — anyone gives a task to anyone (or to themselves): title, details,
   priority, due date, an optional project and an optional checklist. The giver is its
   reviewer.
2. **Seen** — recorded the first time the *assignee* opens the task. Nobody else's visit
   counts. A task given to oneself is seen at once.
3. **Started** — only the assignee starts it (starting also marks it seen).
4. **Worked on** — the assignee logs each day worked and its hours, ticks the checklist,
   and may put the task **on hold** with a reason, then resume it.
5. **Handed in** — only when every checklist item is ticked and some work is logged.
6. **Reviewed** — the giver (or the system admin) **accepts** it as done, or **sends it
   back** with a reason, which returns it to work and counts the return.

The giver can **reassign** an open task (the new assignee starts afresh: unseen, not
started; the work already logged stays under its author's name) or **cancel** it with a
reason. A closed task (done or cancelled) takes no more moves; anyone can still comment.

## The day counts

- **Working days** — calendar days from the day work started to the day it was handed in,
  accepted or cancelled (or today), both days counted. Time on hold is included.
- **Days with work logged** and **hours logged** — from the work log.
- **Days since given**, **seen after N hours**, and **days late** — open past the due
  date, or accepted after it.

## Rules

- Only the assignee starts, holds, resumes, logs work, ticks the checklist and hands in.
- Only the giver (or the system admin) accepts, sends back, reassigns and cancels.
- Holding, sending back and cancelling need a reason.
- A day's logged hours cannot exceed 24; no day before the start, none in the future.
- A due date cannot be in the past when the task is given.

## Alerts

Open tasks past their due date (red), due within two days (amber), and tasks not opened
by their assignee two days after being given (amber).
