import { Eye, EyeOff } from "lucide-react";
import { TaskRow } from "services";
import { formatDateTime } from "utils";

type SeenMarkProps = {
  task: Pick<TaskRow, "seenAt" | "clock" | "assigneeUuid" | "assignedByUuid">;
};

/** Whether the assignee has opened the task yet, and how soon after it was given. */
export const SeenMark = ({ task }: SeenMarkProps) =>
  task.seenAt ? (
    <span className="inline-flex items-center gap-1.5 text-sm text-success" title={`Seen ${formatDateTime(task.seenAt)}`}>
      <Eye size={14} />
      <span>Seen</span>
      {task.clock.seenAfterHours !== null && task.assigneeUuid !== task.assignedByUuid && (
        <span className="text-xs text-muted">
          {task.clock.seenAfterHours < 1 ? "within the hour" : task.clock.seenAfterHours < 48 ? `after ${Math.round(task.clock.seenAfterHours)}h` : `after ${Math.round(task.clock.seenAfterHours / 24)} days`}
        </span>
      )}
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 text-sm ${task.clock.assignedDays >= 2 ? "text-danger" : "text-warning"}`}>
      <EyeOff size={14} />
      <span>Not seen</span>
      {task.clock.assignedDays > 0 && <span className="text-xs text-muted">{task.clock.assignedDays} day(s)</span>}
    </span>
  );
