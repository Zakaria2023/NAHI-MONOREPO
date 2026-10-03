import { AmendOrder } from "@/components/procurement/amend-order";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const AmendOrderPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <AmendOrder uuid={uuid} />
    </AsyncSection>
  );
};

export default AmendOrderPage;
