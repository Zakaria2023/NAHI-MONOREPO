import { addHours, isPast } from "utils";
import {
  DocumentStatus,
  StcDocumentKey,
  StcParty,
  StcPatStep,
  StcStage,
  stcDocuments,
  stcPatSteps,
} from "../../../../db/enum";
import {
  STC_DOCUMENT_LABELS,
  STC_PARTY_LABELS,
  STC_PAT_STEP_LABELS,
} from "../../../../db/label";
import { StcDocument, StcWorkflow } from "../../../../db/types";

// THE STC RULES (docs/stc-workflow.md, section 5), as pure functions over a
// project's STC workflow.

export type StcDocumentSpec = {
  stage: StcStage;
  /** Every one of these must approve for the document to count as approved. */
  parties: StcParty[];
  /** "required" gates its stage; "later" may follow; "conditional" only when flagged. */
  requirement: "required" | "later" | "conditional";
};

export type StcDocumentView = {
  key: StcDocumentKey;
  status: DocumentStatus;
  spec: StcDocumentSpec;
  /** The parties whose approval is still outstanding. */
  awaiting: StcParty[];
  doc: StcDocument;
};

/** Hours to wait after the design End Date before moving to M2 (rule 1). */
export const STC_DESIGN_WAIT_HOURS = 24;

/** The five documents that make up RFS. */
export const RFS_DOCUMENTS: StcDocumentKey[] = [
  "budget_calculator",
  "odf_tb_power_meter",
  "otdr_splice_average",
  "material_form",
  "ftr",
];

/**
 * Who approves each document. The M2 documents' and the M4 approver are blank in
 * the source; see the assumptions in docs/stc-workflow.md.
 */
export const STC_DOCUMENT_SPECS: Record<StcDocumentKey, StcDocumentSpec> = {
  permit_application: { stage: "m2", parties: ["stc"], requirement: "required" },
  permit_receipt: { stage: "m2", parties: ["stc"], requirement: "required" },
  baladiyah: { stage: "m2", parties: ["stc"], requirement: "later" },
  budget_calculator: { stage: "m3", parties: ["inspector", "supervisor"], requirement: "required" },
  odf_tb_power_meter: { stage: "m3", parties: ["inspector", "supervisor"], requirement: "required" },
  otdr_splice_average: { stage: "m3", parties: ["inspector", "supervisor"], requirement: "required" },
  material_form: { stage: "m3", parties: ["inspector", "supervisor"], requirement: "required" },
  ftr: { stage: "m3", parties: ["inspector", "supervisor"], requirement: "required" },
  as_built: { stage: "m3", parties: ["inspector", "supervisor"], requirement: "required" },
  c09: { stage: "m3", parties: ["supervisor"], requirement: "conditional" },
  m4_document: { stage: "m4", parties: ["supervisor"], requirement: "required" },
  ho_screenshot: { stage: "m4", parties: ["supervisor"], requirement: "required" },
  m5_acceptance: { stage: "m5", parties: ["stc_qc", "project_manager"], requirement: "required" },
};

const STAGE_ORDER: StcStage[] = ["design", "m2", "m3", "m4", "m5", "completed"];

export const stcStageIndex = (stage: StcStage): number => STAGE_ORDER.indexOf(stage);

export const findStcDocument = (workflow: StcWorkflow, key: StcDocumentKey): StcDocument =>
  workflow.documents.find((d) => d.key === key) ?? { key, approvals: [] };

/** Each party's latest decision decides; a re-upload clears them (see the service). */
export const stcDocumentStatus = (doc: StcDocument): DocumentStatus => {
  if (!doc.uploadedAt) {
    return "missing";
  }
  const spec = STC_DOCUMENT_SPECS[doc.key];
  const latest = spec.parties.map(
    (party) => [...doc.approvals].reverse().find((a) => a.party === party)?.decision,
  );
  if (latest.includes("rejected")) {
    return "rejected";
  }
  return latest.every((decision) => decision === "approved") ? "approved" : "pending";
};

export const isStcDocumentApproved = (workflow: StcWorkflow, key: StcDocumentKey): boolean =>
  stcDocumentStatus(findStcDocument(workflow, key)) === "approved";

export const stcDocumentViews = (workflow: StcWorkflow): StcDocumentView[] =>
  stcDocuments.map((key) => {
    const doc = findStcDocument(workflow, key);
    const spec = STC_DOCUMENT_SPECS[key];
    return {
      key,
      doc,
      spec,
      status: stcDocumentStatus(doc),
      awaiting: spec.parties.filter(
        (party) => [...doc.approvals].reverse().find((a) => a.party === party)?.decision !== "approved",
      ),
    };
  });

/** Rule 1: when the wait after the design End Date ends, or null before it appears. */
export const designWaitEndsAt = (workflow: StcWorkflow): string | null =>
  workflow.designEndDate ? addHours(workflow.designEndDate, STC_DESIGN_WAIT_HOURS) : null;

/** Rule 2 + 3: Permit Application and Permit Receipt approved; Baladiyah plays no part. */
export const m2EndDateDue = (workflow: StcWorkflow): boolean =>
  isStcDocumentApproved(workflow, "permit_application") &&
  isStcDocumentApproved(workflow, "permit_receipt");

export const isRfsApproved = (workflow: StcWorkflow): boolean =>
  RFS_DOCUMENTS.every((key) => isStcDocumentApproved(workflow, key));

/** Rule 6: the Milestone needs a C09 and does not have one. */
export const milestoneNeedsC09 = (workflow: StcWorkflow): boolean =>
  (workflow.milestone.qtyIncreased || workflow.milestone.newUpl) &&
  findStcDocument(workflow, "c09").uploadedAt === undefined;

/** The warning shown before a Milestone approval (section 6, third request). */
export const milestoneWarning = (workflow: StcWorkflow): string | null =>
  milestoneNeedsC09(workflow)
    ? "Quantity increased or a new UPL was added, and no C09 is prepared — approving the Milestone now will reject it automatically (rule 6)"
    : null;

/** Why the stage after the current one cannot be opened yet, or null. */
export const stcAdvanceBlocker = (workflow: StcWorkflow, now: string): string | null => {
  switch (workflow.stage) {
    case "design": {
      // Rule 1.
      const endsAt = designWaitEndsAt(workflow);
      if (!workflow.designClosedAt || !endsAt) {
        return "The design must be closed in ISOW and its End Date recorded";
      }
      return isPast(endsAt, now)
        ? null
        : "M2 opens 24 hours after the design End Date (rule 1)";
    }
    case "m2":
      if (!workflow.m2EndDate) {
        return "The M2 End Date appears once Permit Application and Permit Receipt are approved (rule 2)";
      }
      // Rule 4.
      return workflow.inspectorName
        ? null
        : "Implementation starts only after the Supervisor assigns the Inspector (rule 4)";
    case "m3":
      // Rule 7.
      if (!workflow.patSteps.pat_completed) {
        return "M4 opens only when PAT is complete for the whole site (rule 7)";
      }
      return workflow.milestone.status === "closed"
        ? null
        : "M4 opens only after M3 is closed — the Milestone is not closed (rule 7)";
    case "m4":
      return isStcDocumentApproved(workflow, "m4_document") &&
        isStcDocumentApproved(workflow, "ho_screenshot")
        ? null
        : "M4 needs the M4 document and the HO screenshot approved";
    case "m5":
      // Rule 8.
      return isStcDocumentApproved(workflow, "m5_acceptance")
        ? null
        : "M5 needs the approval of STC QC and the PM";
    case "completed":
      return "Every stage is complete";
  }
};

export const nextStcStage = (stage: StcStage): StcStage | null =>
  STAGE_ORDER[stcStageIndex(stage) + 1] ?? null;

/** Documents may be worked on in their own stage and after it, never before. */
export const stcDocumentBlocker = (workflow: StcWorkflow, key: StcDocumentKey): string | null => {
  const spec = STC_DOCUMENT_SPECS[key];
  if (stcStageIndex(workflow.stage) < stcStageIndex(spec.stage)) {
    return `${STC_DOCUMENT_LABELS[key]} belongs to a later stage`;
  }
  return null;
};

export const stcApprovalBlocker = (
  workflow: StcWorkflow,
  key: StcDocumentKey,
  party: StcParty,
): string | null => {
  const docBlocker = stcDocumentBlocker(workflow, key);
  if (docBlocker) {
    return docBlocker;
  }
  const doc = findStcDocument(workflow, key);
  if (!doc.uploadedAt) {
    return "Upload the document first";
  }
  if (!STC_DOCUMENT_SPECS[key].parties.includes(party)) {
    return `${STC_PARTY_LABELS[party]} does not approve ${STC_DOCUMENT_LABELS[key]}`;
  }
  return null;
};

/** PAT steps run in order (section 3, M3). */
export const stcPatStepBlocker = (workflow: StcWorkflow, step: StcPatStep): string | null => {
  if (workflow.stage !== "m3") {
    return "PAT runs in M3";
  }
  if (workflow.patSteps[step]) {
    return "Already recorded";
  }
  const index = stcPatSteps.indexOf(step);
  const previous = index > 0 ? stcPatSteps[index - 1] : null;
  return previous && !workflow.patSteps[previous]
    ? `Needs: ${STC_PAT_STEP_LABELS[previous]}`
    : null;
};

/** Rule 5: both approvals; RFS must be approved first, which is what shows the M3 End Date. */
export const milestoneApprovalBlocker = (
  workflow: StcWorkflow,
  party: "inspector" | "supervisor",
): string | null => {
  if (workflow.stage !== "m3") {
    return "The Milestone is closed in M3";
  }
  if (workflow.milestone.status !== "open") {
    return workflow.milestone.status === "closed"
      ? "The Milestone is already closed"
      : "The Milestone was rejected — resubmit it first";
  }
  if (!workflow.m3EndDate) {
    return "The Milestone can be closed once RFS is approved and the M3 End Date appears";
  }
  if (!isStcDocumentApproved(workflow, "as_built")) {
    return "As-Built must be approved by the Inspector and the Supervisor";
  }
  const already =
    party === "inspector"
      ? workflow.milestone.inspectorApprovedAt
      : workflow.milestone.supervisorApprovedAt;
  return already ? `${STC_PARTY_LABELS[party]} has already approved` : null;
};

/** What is still outstanding for the current stage — the approvals board. */
export const stcMissingItems = (workflow: StcWorkflow, now: string): string[] => {
  const docs = stcDocumentViews(workflow)
    .filter((view) => view.spec.stage === workflow.stage && view.status !== "approved")
    .filter((view) => view.spec.requirement !== "conditional" || milestoneNeedsC09(workflow))
    .map((view) =>
      view.status === "missing"
        ? `${STC_DOCUMENT_LABELS[view.key]} not uploaded`
        : `${STC_DOCUMENT_LABELS[view.key]}: awaiting ${view.awaiting.map((p) => STC_PARTY_LABELS[p]).join(" + ")}`,
    );
  if (workflow.stage === "m3") {
    const pat = stcPatSteps
      .filter((step) => !workflow.patSteps[step])
      .map((step) => STC_PAT_STEP_LABELS[step]);
    return [...docs, ...pat];
  }
  const blocker = stcAdvanceBlocker(workflow, now);
  return blocker && docs.length === 0 && workflow.stage !== "completed" ? [blocker] : docs;
};
