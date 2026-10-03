import { getBudget } from "services";
import { Card } from "ui";
import { addStudyLineAction } from "@/app/(dashboard)/finance/budgets/[projectUuid]/study/lines/new/actions";
import { PageHeader } from "@/components/shared/page-header";
import { StudyLineForm } from "./study-line-form";

type NewStudyLineProps = {
  projectUuid: string;
};

export const NewStudyLine = async ({ projectUuid }: NewStudyLineProps) => {
  const { project } = await getBudget(projectUuid);
  return (
    <>
      <PageHeader
        title="Add a study line"
        description={`${project.code} — ${project.name}. Quantities and costs: equipment with how it is supplied, manpower by job title and headcount.`}
        back={{ href: `/finance/budgets/${project.uuid}/study`, label: `${project.code} budget study` }}
      />
      <Card title="Study line" description="The amount is the quantity times the unit cost, times the duration when there is one">
        <StudyLineForm action={addStudyLineAction.bind(null, project.uuid)} />
      </Card>
    </>
  );
};
