import { DashboardView } from "@/components/dashboard/dashboard-view";
import { AsyncSection } from "@/components/shared/async-section";

const DashboardPage = () => (
  <AsyncSection reloadKey="dashboard">
    <DashboardView />
  </AsyncSection>
);

export default DashboardPage;
