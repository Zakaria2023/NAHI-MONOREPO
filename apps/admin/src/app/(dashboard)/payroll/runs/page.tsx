import { PayrollRunsBoard } from "@/components/payroll/payroll-runs-board";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const PayrollRunsPage = () => (
  <>
    <PageHeader
      title="Payroll"
      description="Each month's payroll: calculated from timesheets and attendance, approved by the finance manager, then paid by bank transfer — with the payslips, the register and the social insurance it produces."
    />
    <AsyncSection reloadKey="payroll-runs">
      <PayrollRunsBoard />
    </AsyncSection>
  </>
);

export default PayrollRunsPage;
