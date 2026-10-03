import { AsyncSection } from "@/components/shared/async-section";
import { MyTaskStats } from "@/components/tasks/my-task-stats";
import { MyTasksBoard } from "@/components/tasks/my-tasks-board";
import { Greeting } from "./greeting";

/** A plain employee's home: their own figures and their tasks as a board. */
export const EmployeeDashboard = () => (
  <>
    <AsyncSection reloadKey="greeting">
      <Greeting />
    </AsyncSection>
    <AsyncSection reloadKey="my-task-stats">
      <MyTaskStats />
    </AsyncSection>
    <AsyncSection reloadKey="my-tasks-board">
      <MyTasksBoard side="mine" />
    </AsyncSection>
  </>
);
