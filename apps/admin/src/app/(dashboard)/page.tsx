import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { ApprovalsPanel } from "@/components/dashboard/approvals-panel";
import { KpiRow } from "@/components/dashboard/kpi-row";
import { ProjectPipeline } from "@/components/dashboard/project-pipeline";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const DashboardPage = () => (
  <>
    <PageHeader title="Dashboard" description="What is waiting on you, what is about to fall due, and where every project stands." />
    <AsyncSection reloadKey="kpis">
      <KpiRow />
    </AsyncSection>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <AsyncSection reloadKey="approvals">
        <ApprovalsPanel />
      </AsyncSection>
      <AsyncSection reloadKey="alerts">
        <AlertsPanel />
      </AsyncSection>
    </div>
    <AsyncSection reloadKey="pipeline">
      <ProjectPipeline />
    </AsyncSection>
  </>
);

export default DashboardPage;
