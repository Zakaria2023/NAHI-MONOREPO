import Link from "next/link";
import { getTask, listTaskAssignees } from "services";
import { Card, StatusPill } from "ui";
import { formatDate } from "utils";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/db/label";
import { markTaskSeenAction } from "@/app/(dashboard)/tasks/[uuid]/actions";
import { ActivityTable } from "@/components/activity/activity-table";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentStaff } from "@/lib/server/auth";
import { TASK_PRIORITY_TONES, TASK_TONES } from "@/lib/status-tones";
import { SeenMarker } from "./seen-marker";
import { TaskActionsCard } from "./task-actions-card";
import { TaskChecklistCard } from "./task-checklist-card";
import { TaskCommentsCard } from "./task-comments-card";
import { TaskTrackingCard } from "./task-tracking-card";
import { TaskWorkLogCard } from "./task-work-log-card";

type TaskViewProps = {
  uuid: string;
};

export const TaskView = async ({ uuid }: TaskViewProps) => {
  const [detail, actor, staff] = await Promise.all([getTask(uuid), getCurrentStaff(), listTaskAssignees()]);
  const { task, row, project } = detail;
  const firstLook = task.assigneeUuid === actor.uuid && !task.seenAt;
  return (
    <>
      {firstLook && <SeenMarker action={markTaskSeenAction.bind(null, task.uuid)} />}
      <PageHeader
        title={task.title}
        description={`${task.number} · given by ${row.assignedByName} to ${row.assigneeName} on ${formatDate(task.assignedAt)}`}
        back={actor.role === "employee" || task.assigneeUuid === actor.uuid ? { href: "/tasks/my", label: "My tasks" } : { href: "/tasks", label: "All tasks" }}
        meta={
          <>
            <StatusPill tone={TASK_TONES[task.status]}>{TASK_STATUS_LABELS[task.status]}</StatusPill>
            <StatusPill tone={TASK_PRIORITY_TONES[task.priority]}>{TASK_PRIORITY_LABELS[task.priority]} priority</StatusPill>
          </>
        }
      />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card title="Details">
            <div className="flex flex-col gap-5">
              {task.description ? <p className="text-sm whitespace-pre-line text-secondary">{task.description}</p> : <p className="text-sm text-muted">No details given.</p>}
              <FactList
                columns={4}
                facts={[
                  { label: "Assigned to", value: row.assigneeName },
                  { label: "Given by", value: row.assignedByName },
                  { label: "Due", value: formatDate(task.dueAt) },
                  {
                    label: "Project",
                    value: project ? (
                      actor.role === "employee" ? (
                        <span dir="ltr">{project.code}</span>
                      ) : (
                        <Link href={`/projects/${project.uuid}`} className="hover:text-primary" dir="ltr">
                          {project.code}
                        </Link>
                      )
                    ) : (
                      "—"
                    ),
                  },
                  ...(task.reason && task.status !== "cancelled"
                    ? [{ label: task.status === "on_hold" ? "On hold because" : "Sent back because", value: task.reason }]
                    : []),
                  ...(task.returnedCount > 0 ? [{ label: "Sent back", value: `${task.returnedCount} time(s)` }] : []),
                ]}
              />
            </div>
          </Card>
          <TaskActionsCard detail={detail} actor={actor} staff={staff} />
          <TaskChecklistCard detail={detail} actor={actor} />
          <TaskWorkLogCard detail={detail} actor={actor} />
          <TaskCommentsCard detail={detail} />
          <Card title="History" description="Every move on this task, newest first">
            <ActivityTable entries={detail.activity} showRecord={false} />
          </Card>
        </div>
        <div className="flex flex-col gap-6 xl:sticky xl:top-6">
          <TaskTrackingCard detail={detail} />
        </div>
      </div>
    </>
  );
};
