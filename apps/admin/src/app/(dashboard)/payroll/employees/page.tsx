import { EmployeesBoard } from "@/components/payroll/employees-board";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const EmployeesPage = () => (
  <>
    <PageHeader
      title="Employees"
      description="Everyone on the payroll — monthly staff with their salary and allowances, and daily workers paid by the days the attendance app records. Each has an account to switch to from the navbar."
      action={{ href: "/payroll/employees/new", label: "New employee" }}
    />
    <AsyncSection reloadKey="employees">
      <EmployeesBoard />
    </AsyncSection>
  </>
);

export default EmployeesPage;
