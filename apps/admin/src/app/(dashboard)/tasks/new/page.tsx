import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";
import { NewTask } from "@/components/tasks/new-task";

type Props = {
  searchParams: Promise<{ to?: string }>;
};

const NewTaskPage = async ({ searchParams }: Props) => {
  const { to } = await searchParams;
  return (
    <>
      <PageHeader
        title="New task"
        description="Give a task to anyone on the staff — or to yourself."
        back={{ href: "/tasks/my", label: "My tasks" }}
      />
      <AsyncSection reloadKey={`new-task-${to ?? ""}`}>
        <NewTask assigneeUuid={to} />
      </AsyncSection>
    </>
  );
};

export default NewTaskPage;
