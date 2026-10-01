import { Card } from "ui";
import { ProjectForm } from "@/components/projects/project-form";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentStaff } from "@/lib/server/auth";

const NewProjectPage = async () => {
  const actor = await getCurrentStaff();
  return (
    <>
      <PageHeader
        title="New project"
        description="A Mobily project starts at the design department's request; an STC project at Design, waiting for ISOW."
        back={{ href: "/projects", label: "Projects" }}
      />
      <Card>
        <ProjectForm projectManagerName={actor.name} />
      </Card>
    </>
  );
};

export default NewProjectPage;
