import { ProjectDetail } from "@/components/projects/project-detail";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const ProjectPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <ProjectDetail uuid={uuid} />
    </AsyncSection>
  );
};

export default ProjectPage;
