import { TaskRow } from "services";
import { formatDate } from "utils";

type DueMarkProps = {
  task: Pick<TaskRow, "dueAt" | "clock" | "status">;
};

/** The due date, and how near or how late — or, once finished, whether it was on time. */
export const DueMark = ({ task }: DueMarkProps) => {
  const { dueInDays, lateDays } = task.clock;
  const tone = lateDays > 0 ? "text-danger" : dueInDays !== null && dueInDays <= 2 ? "text-warning" : "text-muted";
  const note =
    task.status === "cancelled"
      ? null
      : dueInDays === null
        ? lateDays > 0
          ? `finished ${lateDays} day(s) late`
          : "on time"
        : lateDays > 0
          ? `${lateDays} day(s) late`
          : dueInDays === 0
            ? "today"
            : `in ${dueInDays} day(s)`;
  return (
    <div className="flex flex-col">
      <span className="text-sm text-ink">{formatDate(task.dueAt)}</span>
      {note && <span className={`text-xs ${tone}`}>{note}</span>}
    </div>
  );
};
