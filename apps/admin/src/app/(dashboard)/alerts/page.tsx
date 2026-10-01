import { AlertsBoard } from "@/components/alerts/alerts-board";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const AlertsPage = () => (
  <>
    <PageHeader
      title="Alerts"
      description="Raised from the data on every load: permits before they expire, FAC and Final Clearance before they fall due, the STC 24-hour wait, late deliveries, custody counts and unpaid invoices."
    />
    <AsyncSection reloadKey="alerts">
      <AlertsBoard />
    </AsyncSection>
  </>
);

export default AlertsPage;
