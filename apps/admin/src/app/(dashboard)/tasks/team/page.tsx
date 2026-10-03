import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";
import { TaskStats } from "@/components/tasks/task-stats";
import { TeamWorkloadTable } from "@/components/tasks/team-workload-table";

const TeamWorkloadPage = () => (
  <>
    <PageHeader
      title="Team workload"
      description="Each employee's tasks: how many are open, not yet seen, late or waiting for review; how many they finished, how many on time, and how many working days they take on average."
      action={{ href: "/tasks/new", label: "New task" }}
    />
    <AsyncSection reloadKey="team-task-stats">
      <TaskStats />
    </AsyncSection>
    <AsyncSection reloadKey="team-workload">
      <TeamWorkloadTable />
    </AsyncSection>
  </>
);

export default TeamWorkloadPage;
