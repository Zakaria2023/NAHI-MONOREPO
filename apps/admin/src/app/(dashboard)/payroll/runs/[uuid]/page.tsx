import { PayrollRunView } from "@/components/payroll/payroll-run-view";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PayrollRunPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <PayrollRunView uuid={uuid} />
    </AsyncSection>
  );
};

export default PayrollRunPage;
