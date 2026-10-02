import { ContractView } from "@/components/procurement/contract-view";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ContractPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <ContractView uuid={uuid} />
    </AsyncSection>
  );
};

export default ContractPage;
