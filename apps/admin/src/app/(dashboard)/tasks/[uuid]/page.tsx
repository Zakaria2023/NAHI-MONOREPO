import { AsyncSection } from "@/components/shared/async-section";
import { TaskView } from "@/components/tasks/task-view";

type Props = {
  params: Promise<{ uuid: string }>;
};

const TaskDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <TaskView uuid={uuid} />
    </AsyncSection>
  );
};

export default TaskDetailPage;
