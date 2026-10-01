import { AsyncSection } from "@/components/shared/async-section";
import { WriteOffView } from "@/components/warehouse/write-off-view";

type Props = {
  params: Promise<{ uuid: string }>;
};

const WriteOffPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <WriteOffView uuid={uuid} />
    </AsyncSection>
  );
};

export default WriteOffPage;
