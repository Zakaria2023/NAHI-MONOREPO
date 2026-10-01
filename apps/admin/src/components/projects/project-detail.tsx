import { getProjectDetail } from "services";
import { Card, StatusPill } from "ui";
import { MOBILY_STAGE_LABELS, STC_STAGE_LABELS } from "@/db/label";
import { ActivityTable } from "@/components/activity/activity-table";
import { OperatorPill } from "@/components/shared/operator-pill";
import { PageHeader } from "@/components/shared/page-header";
import { MobilyWorkspace } from "./mobily/mobily-workspace";
import { ProjectFacts } from "./project-facts";
import { StcWorkspace } from "./stc/stc-workspace";

type ProjectDetailProps = {
  uuid: string;
};

export const ProjectDetail = async ({ uuid }: ProjectDetailProps) => {
  const { project, mobily, stc, activity } = await getProjectDetail(uuid);
  const stageLabel = mobily
    ? mobily.currentStage === "closed"
      ? "PO closed"
      : MOBILY_STAGE_LABELS[mobily.currentStage]
    : stc
      ? STC_STAGE_LABELS[stc.workflow.stage]
      : "";
  return (
    <>
      <PageHeader
        title={`${project.code} — ${project.name}`}
        back={{ href: "/projects", label: "Projects" }}
        meta={
          <>
            <OperatorPill operator={project.operator} />
            <StatusPill tone="info">{stageLabel}</StatusPill>
          </>
        }
      />
      <ProjectFacts project={project} />
      {mobily && <MobilyWorkspace project={project} detail={mobily} />}
      {stc && <StcWorkspace project={project} detail={stc} />}
      <Card title="Log" description="Dates, documents and approvals, and who recorded them">
        <ActivityTable entries={activity} showRecord={false} />
      </Card>
    </>
  );
};
