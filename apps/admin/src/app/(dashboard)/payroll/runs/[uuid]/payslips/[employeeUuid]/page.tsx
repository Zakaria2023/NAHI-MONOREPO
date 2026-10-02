import { PayslipView } from "@/components/payroll/payslip-view";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string; employeeUuid: string }>;
};

const PayslipPage = async ({ params }: Props) => {
  const { uuid, employeeUuid } = await params;
  return (
    <AsyncSection reloadKey={`${uuid}-${employeeUuid}`}>
      <PayslipView runUuid={uuid} employeeUuid={employeeUuid} />
    </AsyncSection>
  );
};

export default PayslipPage;
