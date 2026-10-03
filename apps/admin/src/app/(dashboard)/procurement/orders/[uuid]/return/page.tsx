import { ReturnToSupplier } from "@/components/procurement/return-to-supplier";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ReturnToSupplierPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <ReturnToSupplier uuid={uuid} />
    </AsyncSection>
  );
};

export default ReturnToSupplierPage;
