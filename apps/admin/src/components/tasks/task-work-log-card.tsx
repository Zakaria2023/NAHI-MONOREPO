import { Actor, TaskDetail, taskMoveBlocker } from "services";
import { Card, Table } from "ui";
import { formatDate } from "utils";
import { logTaskWorkAction } from "@/app/(dashboard)/tasks/[uuid]/actions";
import { BlockedNote } from "@/components/warehouse/blocked-note";
import { WorkLogForm } from "./work-log-form";

type TaskWorkLogCardProps = {
  detail: TaskDetail;
  actor: Actor;
};

/** Each day worked on the task and its hours — what "days working on it" is counted from. */
export const TaskWorkLogCard = ({ detail, actor }: TaskWorkLogCardProps) => {
  const { task, row } = detail;
  const blocker = taskMoveBlocker(task, actor, "log_work");
  const logs = [...task.workLogs].sort((a, b) => b.date.localeCompare(a.date) || b.at.localeCompare(a.at));
  return (
    <Card title="Work log" description={`${row.clock.loggedHours} hour(s) over ${row.clock.loggedDays} day(s)`}>
      <div className="flex flex-col gap-5">
        {task.assigneeUuid === actor.uuid &&
          task.status !== "done" &&
          task.status !== "cancelled" &&
          (blocker ? <BlockedNote reason={blocker} /> : <WorkLogForm action={logTaskWorkAction.bind(null, task.uuid)} />)}
        <Table
          data={logs}
          rowKey={(l) => l.uuid}
          emptyMessage="No work logged yet."
          columns={[
            { key: "date", header: "Day", render: (l) => <span className="whitespace-nowrap">{formatDate(l.date)}</span> },
            { key: "hours", header: "Hours", align: "end", render: (l) => <span className="font-medium">{l.hours}</span> },
            { key: "note", header: "What was done", wrap: true, render: (l) => l.note ?? <span className="text-muted">—</span> },
            { key: "by", header: "By", render: (l) => <span className="text-secondary">{l.by}</span> },
          ]}
        />
      </div>
    </Card>
  );
};
