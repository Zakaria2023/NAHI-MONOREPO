import { AsyncSection } from "@/components/shared/async-section";
import { TransferView } from "@/components/warehouse/transfer-view";

type Props = {
  params: Promise<{ uuid: string }>;
};

const TransferPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <TransferView uuid={uuid} />
    </AsyncSection>
  );
};

export default TransferPage;
