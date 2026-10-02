import { ReportsCatalogue } from "@/components/reports/reports-catalogue";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const ReportsPage = () => (
  <>
    <PageHeader
      title="Reports"
      description="Every report the four specification documents ask for, by area. Each opens with Excel export and a print / PDF view; some are screens of their own."
    />
    <AsyncSection reloadKey="reports">
      <ReportsCatalogue />
    </AsyncSection>
  </>
);

export default ReportsPage;
