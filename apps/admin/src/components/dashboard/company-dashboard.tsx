import { AsyncSection } from "@/components/shared/async-section";
import { AlertsPanel } from "./alerts-panel";
import { ApprovalsPanel } from "./approvals-panel";
import { CompanyOverview } from "./company-overview";
import { Greeting } from "./greeting";
import { KpiRow } from "./kpi-row";
import { MyTasksPanel } from "./my-tasks-panel";
import { ProjectPipeline } from "./project-pipeline";

type CompanyDashboardProps = {
  /** False for the admin, who is given no tasks of their own. */
  ownTasks: boolean;
};

/** The admin's and staff's home: the headline figures, every area of the company, then their own queue. */
export const CompanyDashboard = ({ ownTasks }: CompanyDashboardProps) => (
  <>
    <AsyncSection reloadKey="greeting">
      <Greeting />
    </AsyncSection>
    <AsyncSection reloadKey="kpis">
      <KpiRow />
    </AsyncSection>
    <AsyncSection reloadKey="company-overview">
      <CompanyOverview />
    </AsyncSection>
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <AsyncSection reloadKey="pipeline">
          <ProjectPipeline />
        </AsyncSection>
      </div>
      <div className="flex flex-col gap-6">
        {ownTasks && (
          <AsyncSection reloadKey="my-tasks">
            <MyTasksPanel />
          </AsyncSection>
        )}
        <AsyncSection reloadKey="approvals">
          <ApprovalsPanel />
        </AsyncSection>
        <AsyncSection reloadKey="alerts">
          <AlertsPanel />
        </AsyncSection>
      </div>
    </div>
  </>
);
