import { SupplierInvoiceDetail } from "@/components/finance/supplier-invoice-detail";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const SupplierInvoicePage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <SupplierInvoiceDetail uuid={uuid} />
    </AsyncSection>
  );
};

export default SupplierInvoicePage;
