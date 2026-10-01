import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { ApprovalsPanel } from "@/components/dashboard/approvals-panel";
import { Greeting } from "@/components/dashboard/greeting";
import { KpiRow } from "@/components/dashboard/kpi-row";
import { ProjectPipeline } from "@/components/dashboard/project-pipeline";
import { AsyncSection } from "@/components/shared/async-section";

const DashboardPage = () => (
  <>
    <AsyncSection reloadKey="greeting">
      <Greeting />
    </AsyncSection>
    <AsyncSection reloadKey="kpis">
      <KpiRow />
    </AsyncSection>
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <AsyncSection reloadKey="pipeline">
          <ProjectPipeline />
        </AsyncSection>
      </div>
      <div className="flex flex-col gap-6">
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

export default DashboardPage;
