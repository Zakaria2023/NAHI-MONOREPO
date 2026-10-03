import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { MyTaskStats } from "@/components/tasks/my-task-stats";
import { MyTasksBoard } from "@/components/tasks/my-tasks-board";

type Props = {
  searchParams: Promise<{ side?: string }>;
};

const MyTasksPage = async ({ searchParams }: Props) => {
  const { side: raw } = await searchParams;
  const side = raw === "given" ? "given" : "mine";
  return (
    <>
      <PageHeader
        title="My tasks"
        description="Open a task to mark it seen, start it, log the days you work on it and hand it in. Tasks you gave others wait here for your review."
        action={{ href: "/tasks/new", label: "New task" }}
      />
      <AsyncSection reloadKey="my-task-stats">
        <MyTaskStats />
      </AsyncSection>
      <FilterTabs
        tabs={[
          { label: "Assigned to me", href: "/tasks/my", active: side === "mine" },
          { label: "Given by me", href: "/tasks/my?side=given", active: side === "given" },
        ]}
      />
      <AsyncSection reloadKey={`my-tasks-${side}`}>
        <MyTasksBoard side={side} />
      </AsyncSection>
    </>
  );
};

export default MyTasksPage;
