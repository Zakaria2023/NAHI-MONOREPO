import { listProjectOptions, listTaskAssignees } from "services";
import { Card } from "ui";
import { TaskForm } from "./task-form";

type NewTaskProps = {
  assigneeUuid?: string;
};

export const NewTask = async ({ assigneeUuid }: NewTaskProps) => {
  const [staff, projects] = await Promise.all([listTaskAssignees(), listProjectOptions()]);
  return (
    <Card
      title="Task"
      description="The assignee sees it in My tasks at once. You are told when they open it, and it comes back to you for review when they hand it in."
    >
      <TaskForm staff={staff} projects={projects} assigneeUuid={staff.some((s) => s.value === assigneeUuid) ? (assigneeUuid ?? "") : ""} />
    </Card>
  );
};
