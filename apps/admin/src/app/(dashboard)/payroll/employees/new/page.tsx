import { NewEmployee } from "@/components/payroll/new-employee";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const NewEmployeePage = () => (
  <>
    <PageHeader
      title="New employee"
      description="Their pay, where their salary goes, and their account — they appear in the navbar's user list and see their own tasks."
      back={{ href: "/payroll/employees", label: "Employees" }}
    />
    <AsyncSection reloadKey="new-employee">
      <NewEmployee />
    </AsyncSection>
  </>
);

export default NewEmployeePage;
