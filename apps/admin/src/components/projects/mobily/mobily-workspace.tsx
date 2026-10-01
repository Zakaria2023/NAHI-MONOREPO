import { MOBILY_STAGE_STEPS, MobilyDetail, Project } from "services";
import { formatDate } from "utils";
import { MobilyStage, mobilyStages } from "@/db/enum";
import { MOBILY_STAGE_LABELS } from "@/db/label";
import {
  addLabTestAction,
  addPermitAction,
  certificateInvoiceAction,
  collectInvoiceAction,
  issuePermitAction,
  labTestResultAction,
  recordMobilyStepAction,
} from "@/app/(dashboard)/projects/[uuid]/actions";
import { KeyDatesCard } from "./key-dates-card";
import { CertificatesPanel } from "./certificates-panel";
import { LabTestsPanel } from "./lab-tests-panel";
import { PermitsPanel } from "./permits-panel";
import { StepRow } from "./step-row";
import { MissingCard } from "../missing-card";
import { StageSection } from "../stage-section";
import { StageStepper } from "../stage-stepper";

type MobilyWorkspaceProps = {
  project: Project;
  detail: MobilyDetail;
};

/** The Mobily cycle (docs/mobily-workflow.md): thirteen stages, each with its steps and their rules. */
export const MobilyWorkspace = ({ project, detail }: MobilyWorkspaceProps) => {
  const stateOf = (stage: MobilyStage) =>
    detail.stages.find((s) => s.stage === stage)?.complete
      ? ("done" as const)
      : stage === detail.currentStage
        ? ("current" as const)
        : ("todo" as const);
  const stepAction = recordMobilyStepAction.bind(null, project.uuid);
  const steps = (stage: MobilyStage) =>
    MOBILY_STAGE_STEPS[stage].map((step) => (
      <StepRow key={step} step={step} record={detail.steps[step]} blocker={detail.stepBlockers[step]} action={stepAction} />
    ));

  const body = (stage: MobilyStage) => {
    switch (stage) {
      case "permits":
        return (
          <PermitsPanel
            permits={detail.permits}
            addAction={addPermitAction.bind(null, project.uuid)}
            issueAction={issuePermitAction.bind(null, project.uuid)}
            canRequest={Boolean(detail.steps.po_received)}
          />
        );
      case "implementation":
        return (
          <>
            {steps(stage)}
            <LabTestsPanel
              tests={detail.labTests}
              addAction={addLabTestAction.bind(null, project.uuid)}
              resultAction={labTestResultAction.bind(null, project.uuid)}
            />
          </>
        );
      case "invoicing":
        return (
          <CertificatesPanel
            detail={detail}
            poValue={project.poValue}
            invoiceAction={certificateInvoiceAction.bind(null, project.uuid)}
            collectAction={(invoiceUuid) => collectInvoiceAction.bind(null, invoiceUuid)}
          />
        );
      default:
        return steps(stage);
    }
  };

  const summaryOf = (stage: MobilyStage): string | undefined => {
    if (stage === "permits") {
      return `${detail.permits.filter((p) => p.issuedAt).length} of ${detail.permits.length} issued`;
    }
    if (stage === "invoicing") {
      return `${detail.invoices.length} of 3 certificate invoices`;
    }
    if (stage === "permit_ho" && detail.finalClearanceDueAt) {
      return `Final Clearance due ${formatDate(detail.finalClearanceDueAt)}`;
    }
    const list = MOBILY_STAGE_STEPS[stage];
    return `${list.filter((s) => detail.steps[s]).length} of ${list.length} steps`;
  };

  return (
    <>
      <StageStepper stages={mobilyStages.map((stage) => ({ key: stage, label: MOBILY_STAGE_LABELS[stage], state: stateOf(stage) }))} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-3 xl:col-span-2">
          {mobilyStages.map((stage, index) => (
            <StageSection key={stage} index={index + 1} title={MOBILY_STAGE_LABELS[stage]} state={stateOf(stage)} summary={summaryOf(stage)}>
              {body(stage)}
            </StageSection>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <MissingCard items={detail.missing} />
          <KeyDatesCard detail={detail} />
        </div>
      </div>
    </>
  );
};
