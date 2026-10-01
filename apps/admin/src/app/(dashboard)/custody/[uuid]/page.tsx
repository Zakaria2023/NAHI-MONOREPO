import { CashCustodyView } from "@/components/custody/cash-custody-view";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const CashCustodyDetailPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <CashCustodyView uuid={uuid} />
    </AsyncSection>
  );
};

export default CashCustodyDetailPage;
