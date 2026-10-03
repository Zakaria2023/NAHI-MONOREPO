import { PaySupplierInvoice } from "@/components/finance/pay-supplier-invoice";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const PaySupplierInvoicePage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <PaySupplierInvoice uuid={uuid} />
    </AsyncSection>
  );
};

export default PaySupplierInvoicePage;
