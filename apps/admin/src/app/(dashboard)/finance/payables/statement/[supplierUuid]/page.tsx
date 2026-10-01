import { SupplierStatement } from "@/components/finance/supplier-statement";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ supplierUuid: string }>;
};

const SupplierStatementPage = async ({ params }: Props) => {
  const { supplierUuid } = await params;
  return (
    <AsyncSection reloadKey={supplierUuid}>
      <SupplierStatement supplierUuid={supplierUuid} />
    </AsyncSection>
  );
};

export default SupplierStatementPage;
