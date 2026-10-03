import { NewStudyLine } from "@/components/costs/new-study-line";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ projectUuid: string }>;
};

const NewStudyLinePage = async ({ params }: Props) => {
  const { projectUuid } = await params;
  return (
    <AsyncSection reloadKey={`new-study-line-${projectUuid}`}>
      <NewStudyLine projectUuid={projectUuid} />
    </AsyncSection>
  );
};

export default NewStudyLinePage;
