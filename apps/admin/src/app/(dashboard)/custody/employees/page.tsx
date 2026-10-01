import { EmployeeCustodyTable } from "@/components/custody/employee-custody-table";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const EmployeeCustodyPage = () => (
  <>
    <PageHeader
      title="Employees & clearance"
      description="The custody statement per employee. Clearance on leaving or moving branch is approved only once every cash and asset custody is settled."
    />
    <AsyncSection reloadKey="employee-custody">
      <EmployeeCustodyTable />
    </AsyncSection>
  </>
);

export default EmployeeCustodyPage;
