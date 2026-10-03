import { LayoutDashboard } from "lucide-react";
import { Project, StcDetail } from "services";
import { Card } from "ui";
import { formatDate } from "utils";
import { StcStage, stcM3Checks, stcPatSteps, stcStages } from "@/db/enum";
import { STC_M3_CHECK_LABELS, STC_PAT_STEP_LABELS, STC_STAGE_LABELS } from "@/db/label";
import {
  advanceStageAction,
  assignInspectorAction,
  recordDesignAction,
  sendToSupervisorAction,
  stcStepAction,
} from "@/app/(dashboard)/projects/[uuid]/actions";
import { ActionButton } from "@/components/shared/action-button";
import { FactList } from "@/components/shared/fact-list";
import { FormDialog } from "@/components/shared/form-dialog";
import { MissingCard } from "../missing-card";
import { StageSection } from "../stage-section";
import { StageStepper } from "../stage-stepper";
import { DesignPanel } from "./design-panel";
import { DocumentsTable } from "./documents-table";
import { InspectorForm } from "./inspector-form";
import { MilestonePanel } from "./milestone-panel";
import { StcStepRow } from "./stc-step-row";

type StcWorkspaceProps = {
  project: Project;
  detail: StcDetail;
};

const WORK_STAGES: StcStage[] = ["design", "m2", "m3", "m4", "m5"];

/** The STC cycle (docs/stc-workflow.md): every stage behind the rule that opens it. */
export const StcWorkspace = ({ project, detail }: StcWorkspaceProps) => {
  const wf = detail.workflow;
  const current = stcStages.indexOf(wf.stage);
  const stateOf = (stage: StcStage) => {
    const index = stcStages.indexOf(stage);
    return wf.stage === "completed" || index < current ? ("done" as const) : index === current ? ("current" as const) : ("todo" as const);
  };
  const docs = (stage: StcStage) => detail.documents.filter((d) => d.spec.stage === stage);
  const editable = (stage: StcStage) => current >= stcStages.indexOf(stage);
  const next = stcStages[current + 1];
  const stepAction = stcStepAction.bind(null, project.uuid);

  const body = (stage: StcStage) => {
    switch (stage) {
      case "design":
        return <DesignPanel detail={detail} designAction={recordDesignAction.bind(null, project.uuid)} />;
      case "m2":
        return (
          <>
            <DocumentsTable projectUuid={project.uuid} documents={docs("m2")} editable={editable("m2")} />
            <FactList
              columns={3}
              facts={[
                { label: "M2 End Date (rule 2)", value: wf.m2EndDate ? formatDate(wf.m2EndDate) : "After Permit Application + Receipt are approved" },
                { label: "Sent to Supervisor", value: wf.sentToSupervisorAt ? formatDate(wf.sentToSupervisorAt) : "—" },
                { label: "Inspector", value: wf.inspectorName ? `${wf.inspectorName} · ${formatDate(wf.inspectorAssignedAt)}` : "Not assigned (rule 4)" },
              ]}
            />
            {wf.stage === "m2" && !wf.sentToSupervisorAt && (
              <ActionButton
                action={sendToSupervisorAction.bind(null, project.uuid)}
                label="Send to Supervisor"
                blocker={wf.m2EndDate ? null : "Available once the M2 End Date appears"}
              />
            )}
            {wf.stage === "m2" && wf.sentToSupervisorAt && !wf.inspectorName && (
              <FormDialog label="Record inspector" title="Inspector assigned" description="The Inspector the Supervisor assigned (rule 4)" variant="primary">
                <InspectorForm action={assignInspectorAction.bind(null, project.uuid)} />
              </FormDialog>
            )}
          </>
        );
      case "m3":
        return (
          <>
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-ink">PAT — in this order</span>
              {stcPatSteps.map((step, index) => (
                <StcStepRow key={step} step={step} index={index + 1} label={STC_PAT_STEP_LABELS[step]} record={wf.patSteps[step]} blocker={detail.patBlockers[step]} action={stepAction} />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-ink">Site requirements</span>
              {stcM3Checks.map((check) => (
                <StcStepRow key={check} step={check} label={STC_M3_CHECK_LABELS[check]} record={wf.m3Checks[check]} blocker={detail.checkBlockers[check]} action={stepAction} />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium text-ink">RFS documents, As-Built and C09 — Inspector + Supervisor</span>
              <DocumentsTable projectUuid={project.uuid} documents={docs("m3")} editable={editable("m3")} />
            </div>
            <MilestonePanel projectUuid={project.uuid} detail={detail} />
          </>
        );
      default:
        return <DocumentsTable projectUuid={project.uuid} documents={docs(stage)} editable={editable(stage)} />;
    }
  };

  return (
    <>
      <StageStepper stages={stcStages.map((stage) => ({ key: stage, label: STC_STAGE_LABELS[stage], state: stage === "completed" && wf.stage === "completed" ? "done" : stateOf(stage) }))} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-3 xl:col-span-2">
          {wf.stage === "completed" ? (
            <div className="flex items-center gap-3 rounded-card border border-success-tint bg-success-tint px-5 py-4 text-success">
              <LayoutDashboard size={20} />
              <span className="text-sm">Every stage approved — on STC&apos;s dashboard since {formatDate(wf.dashboardAt)} (rule 8).</span>
            </div>
          ) : (
            next && (
              <Card title={`Next: ${STC_STAGE_LABELS[next]}`} description="Opens only when the rule guarding it is met">
                <ActionButton action={advanceStageAction.bind(null, project.uuid)} label={`Move to ${STC_STAGE_LABELS[next]}`} blocker={detail.advanceBlocker} />
              </Card>
            )
          )}
          {WORK_STAGES.map((stage, index) => (
            <StageSection key={stage} index={index + 1} title={STC_STAGE_LABELS[stage]} state={stateOf(stage)}>
              {body(stage)}
            </StageSection>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <MissingCard items={detail.missing} />
          <Card title="Stage history">
            <ul className="flex flex-col gap-2">
              {wf.stageHistory.length === 0 && <li className="text-sm text-muted">Still in Design.</li>}
              {wf.stageHistory.map((entry) => (
                <li key={`${entry.stage}-${entry.at}`} className="flex justify-between gap-3 text-sm">
                  <span className="text-ink">{STC_STAGE_LABELS[entry.stage]}</span>
                  <span className="text-muted">{formatDate(entry.at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
};
