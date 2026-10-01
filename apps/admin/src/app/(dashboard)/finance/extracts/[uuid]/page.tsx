import { ExtractDetail } from "@/components/finance/extract-detail";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ExtractPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <ExtractDetail uuid={uuid} />
    </AsyncSection>
  );
};

export default ExtractPage;
