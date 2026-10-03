import { MessageSquarePlus } from "lucide-react";
import { TaskDetail } from "services";
import { Card } from "ui";
import { formatDateTime, initialsOf } from "utils";
import { commentOnTaskAction } from "@/app/(dashboard)/tasks/[uuid]/actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { CommentForm } from "./comment-form";

type TaskCommentsCardProps = {
  detail: TaskDetail;
};

/** The conversation about the task, oldest first. */
export const TaskCommentsCard = ({ detail }: TaskCommentsCardProps) => {
  const { task } = detail;
  return (
    <Card title="Comments" description={task.comments.length ? `${task.comments.length} comment(s)` : "No comments yet"}>
      <div className="flex flex-col gap-5">
        {task.comments.length > 0 && (
          <ul className="flex flex-col gap-4">
            {task.comments.map((c) => (
              <li key={c.uuid} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xs font-medium text-primary">{initialsOf(c.by)}</span>
                <div className="flex flex-1 flex-col gap-1 rounded-control border border-hairline-soft bg-hover px-3.5 py-2.5">
                  <span className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium text-ink">{c.by}</span>
                    <span className="text-xs text-muted">{formatDateTime(c.at)}</span>
                  </span>
                  <p className="text-sm whitespace-pre-line text-secondary">{c.text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <FormDialog label="Add comment" title="Add comment" description="Ask, answer, or note progress — everyone on the task sees it" icon={<MessageSquarePlus size={16} />}>
          <CommentForm action={commentOnTaskAction.bind(null, task.uuid)} />
        </FormDialog>
      </div>
    </Card>
  );
};
