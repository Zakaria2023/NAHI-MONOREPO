import { TaskView } from "services";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { TaskAssigneeFilter } from "@/components/tasks/task-assignee-filter";
import { TaskStats } from "@/components/tasks/task-stats";
import { TasksTable } from "@/components/tasks/tasks-table";

type Props = {
  searchParams: Promise<{ view?: string; assignee?: string }>;
};

const TABS: { view: TaskView; label: string }[] = [
  { view: "open", label: "Open" },
  { view: "unseen", label: "Not seen" },
  { view: "overdue", label: "Overdue" },
  { view: "todo", label: "To do" },
  { view: "in_progress", label: "In progress" },
  { view: "on_hold", label: "On hold" },
  { view: "in_review", label: "Waiting for review" },
  { view: "done", label: "Done" },
  { view: "cancelled", label: "Cancelled" },
  { view: "all", label: "All" },
];

const TasksPage = async ({ searchParams }: Props) => {
  const { view: raw, assignee } = await searchParams;
  const view = TABS.find((t) => t.view === raw)?.view ?? "open";
  const query = assignee ? `&assignee=${assignee}` : "";
  return (
    <>
      <PageHeader
        title="All tasks"
        description="Every task given across the company: who has it, whether they have seen it, how many days they have been working on it, and whether it is finished."
        action={{ href: "/tasks/new", label: "New task" }}
      />
      <AsyncSection reloadKey={`task-stats-${assignee ?? ""}`}>
        <TaskStats assigneeUuid={assignee} />
      </AsyncSection>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <FilterTabs tabs={TABS.map((t) => ({ label: t.label, href: `/tasks?view=${t.view}${query}`, active: view === t.view }))} />
        <AsyncSection reloadKey="task-assignees">
          <TaskAssigneeFilter view={view} selected={assignee} />
        </AsyncSection>
      </div>
      <AsyncSection reloadKey={`tasks-${view}-${assignee ?? ""}`}>
        <TasksTable view={view} assigneeUuid={assignee} />
      </AsyncSection>
    </>
  );
};

export default TasksPage;
