import { CalendarClock, Hourglass, ListChecks, UserRound } from "lucide-react";
import Link from "next/link";
import { TaskRow } from "services";
import { StatusPill } from "ui";
import { TASK_PRIORITY_LABELS } from "@/db/label";
import { ProgressBar } from "@/components/shared/progress-bar";
import { TASK_PRIORITY_TONES } from "@/lib/status-tones";
import { DueMark } from "./due-mark";
import { SeenMark } from "./seen-mark";

type TaskCardProps = {
  task: TaskRow;
  /** Whose name the card shows: the assignee on a giver's board, the giver on the assignee's. */
  person: "assignee" | "giver";
};

/** One task on a board column; the whole card opens it. */
export const TaskCard = ({ task, person }: TaskCardProps) => (
  <article className="relative flex flex-col gap-3 rounded-card border border-hairline bg-surface p-4 transition-colors hover:border-search-border">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted" dir="ltr">
        {task.number}
        {task.projectCode && ` · ${task.projectCode}`}
      </span>
      <StatusPill tone={TASK_PRIORITY_TONES[task.priority]}>{TASK_PRIORITY_LABELS[task.priority]}</StatusPill>
    </div>
    <Link href={`/tasks/${task.uuid}`} className="text-sm font-medium text-ink after:absolute after:inset-0 hover:text-primary">
      {task.title}
    </Link>
    <div className="flex flex-col gap-2 text-xs text-secondary">
      <span className="flex items-center gap-1.5">
        <UserRound size={13} className="text-faint" />
        {person === "assignee" ? task.assigneeName : `From ${task.assignedByName}`}
      </span>
      <span className="flex items-center gap-1.5">
        <CalendarClock size={13} className="text-faint" />
        <DueMark task={task} />
      </span>
      {task.clock.workingDays !== null && (
        <span className="flex items-center gap-1.5">
          <Hourglass size={13} className="text-faint" />
          Day {task.clock.workingDays} · {task.clock.loggedHours} h logged
        </span>
      )}
      {task.progress.total > 0 && (
        <span className="flex items-center gap-1.5">
          <ListChecks size={13} className="text-faint" />
          <span className="flex flex-1 items-center gap-2">
            {task.progress.done}/{task.progress.total}
            <ProgressBar value={task.progress.done / task.progress.total} />
          </span>
        </span>
      )}
    </div>
    <div className="border-t border-hairline-soft pt-2.5">
      <SeenMark task={task} />
    </div>
  </article>
);
