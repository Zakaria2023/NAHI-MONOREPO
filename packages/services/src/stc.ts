import { nowIso, toIso } from "utils";
import {
  AssignInspectorInput,
  MilestoneFlagsInput,
  StcDecisionInput,
  StcDesignInput,
  StcStepInput,
  StcUploadInput,
} from "validators";
import { transact } from "../../../db";
import { StcM3Check, StcPatStep, stcPatSteps } from "../../../db/enum";
import {
  STC_DOCUMENT_LABELS,
  STC_M3_CHECK_LABELS,
  STC_PARTY_LABELS,
  STC_PAT_STEP_LABELS,
  STC_STAGE_LABELS,
} from "../../../db/label";
import { Project, StcDocument, StcWorkflow, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertNotFuture } from "./core/lookup";
import { editableProject } from "./projects";
import {
  isRfsApproved,
  m2EndDateDue,
  milestoneApprovalBlocker,
  milestoneNeedsC09,
  nextStcStage,
  stcAdvanceBlocker,
  stcApprovalBlocker,
  stcDocumentBlocker,
  stcPatStepBlocker,
} from "./rules/stc";

const stcOf = (project: Project): StcWorkflow => {
  if (!project.stc) {
    throw new Error("Not an STC project");
  }
  return project.stc;
};

const log = (store: Store, actor: Actor, project: Project, action: string, detail?: string) =>
  logActivity(store, {
    actorName: actor.name,
    entity: "project",
    entityUuid: project.uuid,
    entityLabel: project.code,
    action,
    detail,
  });

const isPatStep = (step: StcStepInput["step"]): step is StcPatStep =>
  (stcPatSteps as readonly string[]).includes(step);

const documentOf = (workflow: StcWorkflow, key: StcDocument["key"]): StcDocument => {
  const existing = workflow.documents.find((d) => d.key === key);
  if (existing) {
    return existing;
  }
  const created: StcDocument = { key, approvals: [] };
  workflow.documents.push(created);
  return created;
};

/**
 * The dates that appear by themselves once their documents are approved:
 * the M2 End Date (rule 2) and the M3 End Date (RFS approved).
 */
const applyAutomaticDates = (store: Store, actor: Actor, project: Project, at: string) => {
  const workflow = stcOf(project);
  if (!workflow.m2EndDate && m2EndDateDue(workflow)) {
    workflow.m2EndDate = at;
    log(store, actor, project, "M2 End Date generated", "Permit Application and Permit Receipt approved");
  }
  if (!workflow.m3EndDate && isRfsApproved(workflow)) {
    workflow.m3EndDate = at;
    log(store, actor, project, "M3 End Date appeared", "All five RFS documents approved");
  }
};

export const recordStcDesign = async (
  actor: Actor,
  projectUuid: string,
  input: StcDesignInput,
): Promise<void> => {
  const closedAt = toIso(input.designClosedAt);
  const endDate = toIso(input.designEndDate);
  assertNotFuture(endDate);
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const workflow = stcOf(project);
    if (workflow.stage !== "design") {
      throw new Error("The design is already past");
    }
    if (endDate < closedAt) {
      throw new Error("The End Date comes after the design is closed in ISOW");
    }
    workflow.designClosedAt = closedAt;
    workflow.designEndDate = endDate;
    log(store, actor, project, "Design closed in ISOW, End Date recorded");
  });
};

/** Moves to the next stage, after the rule that guards it. M5 → the dashboard (rule 8). */
export const advanceStcStage = async (actor: Actor, projectUuid: string): Promise<void> =>
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const workflow = stcOf(project);
    const now = nowIso();
    const blocker = stcAdvanceBlocker(workflow, now);
    const next = nextStcStage(workflow.stage);
    if (blocker || !next) {
      throw new Error(blocker ?? "Every stage is complete");
    }
    workflow.stage = next;
    workflow.stageHistory.push({ stage: next, at: now, by: actor.name });
    if (next === "completed") {
      workflow.dashboardAt = now;
    }
    log(store, actor, project, `Moved to ${STC_STAGE_LABELS[next]}`);
  });

/** A re-upload replaces the file and clears its approvals: they were for the old one. */
export const uploadStcDocument = async (
  actor: Actor,
  projectUuid: string,
  input: StcUploadInput,
): Promise<void> =>
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const workflow = stcOf(project);
    const blocker = stcDocumentBlocker(workflow, input.key);
    if (blocker) {
      throw new Error(blocker);
    }
    const doc = documentOf(workflow, input.key);
    const replacing = Boolean(doc.uploadedAt);
    doc.uploadedAt = nowIso();
    doc.fileName = input.fileName;
    doc.approvals = [];
    log(store, actor, project, `${STC_DOCUMENT_LABELS[input.key]} ${replacing ? "re-uploaded" : "uploaded"}`, input.fileName);
  });

/** Records a party's decision, then lets the dates that follow from it appear. */
export const decideStcDocument = async (
  actor: Actor,
  projectUuid: string,
  input: StcDecisionInput,
): Promise<void> =>
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const workflow = stcOf(project);
    const blocker = stcApprovalBlocker(workflow, input.key, input.party);
    if (blocker) {
      throw new Error(blocker);
    }
    const at = nowIso();
    documentOf(workflow, input.key).approvals.push({
      party: input.party,
      decision: input.decision,
      at,
      by: actor.name,
      note: input.note?.trim() || undefined,
    });
    log(
      store,
      actor,
      project,
      `${STC_DOCUMENT_LABELS[input.key]} ${input.decision} by ${STC_PARTY_LABELS[input.party]}`,
      input.note,
    );
    applyAutomaticDates(store, actor, project, at);
  });

export const sendStcToSupervisor = async (actor: Actor, projectUuid: string): Promise<void> =>
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const workflow = stcOf(project);
    if (!workflow.m2EndDate) {
      throw new Error("Send to the Supervisor once the M2 End Date is available (rule 2)");
    }
    if (workflow.sentToSupervisorAt) {
      throw new Error("Already sent to the Supervisor");
    }
    workflow.sentToSupervisorAt = nowIso();
    log(store, actor, project, "Sent to Supervisor");
  });

/** Rule 4: the Supervisor's assignment is what lets Implementation start. */
export const assignStcInspector = async (
  actor: Actor,
  projectUuid: string,
  input: AssignInspectorInput,
): Promise<void> =>
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const workflow = stcOf(project);
    if (!workflow.sentToSupervisorAt) {
      throw new Error("The Supervisor assigns the Inspector after the project is sent to them");
    }
    workflow.inspectorName = input.inspectorName;
    workflow.inspectorAssignedAt = nowIso();
    log(store, actor, project, "Inspector assigned by Supervisor", input.inspectorName);
  });

export const recordStcStep = async (
  actor: Actor,
  projectUuid: string,
  input: StcStepInput,
): Promise<void> => {
  const at = toIso(input.at);
  assertNotFuture(at);
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const workflow = stcOf(project);
    if (isPatStep(input.step)) {
      const blocker = stcPatStepBlocker(workflow, input.step);
      if (blocker) {
        throw new Error(blocker);
      }
      workflow.patSteps[input.step] = { at, by: actor.name };
      log(store, actor, project, STC_PAT_STEP_LABELS[input.step]);
      return;
    }
    const check: StcM3Check = input.step;
    if (workflow.stage !== "m3") {
      throw new Error("Recorded in M3");
    }
    workflow.m3Checks[check] = { at, by: actor.name };
    log(store, actor, project, STC_M3_CHECK_LABELS[check]);
  });
};

export const setStcMilestoneFlags = async (
  actor: Actor,
  projectUuid: string,
  input: MilestoneFlagsInput,
): Promise<void> =>
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const milestone = stcOf(project).milestone;
    if (milestone.status === "closed") {
      throw new Error("The Milestone is closed");
    }
    milestone.qtyIncreased = input.qtyIncreased;
    milestone.newUpl = input.newUpl;
    log(
      store,
      actor,
      project,
      "Milestone flags updated",
      [input.qtyIncreased && "quantity increased", input.newUpl && "new UPL"].filter(Boolean).join(", ") || "none",
    );
  });

/**
 * Rules 5 and 6. An approval on a Milestone that needs a C09 and has none
 * rejects it instead; otherwise it records the party, and both close it.
 */
export const approveStcMilestone = async (
  actor: Actor,
  projectUuid: string,
  party: "inspector" | "supervisor",
): Promise<{ rejected: boolean }> =>
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const workflow = stcOf(project);
    const blocker = milestoneApprovalBlocker(workflow, party);
    if (blocker) {
      throw new Error(blocker);
    }
    const now = nowIso();
    const milestone = workflow.milestone;
    if (milestoneNeedsC09(workflow)) {
      milestone.status = "rejected";
      milestone.rejectionReason = "Quantity increased or new UPL without a C09 (rule 6)";
      milestone.inspectorApprovedAt = undefined;
      milestone.supervisorApprovedAt = undefined;
      log(store, actor, project, "Milestone rejected automatically", milestone.rejectionReason);
      return { rejected: true };
    }
    if (party === "inspector") {
      milestone.inspectorApprovedAt = now;
    } else {
      milestone.supervisorApprovedAt = now;
    }
    log(store, actor, project, `Milestone approved by ${STC_PARTY_LABELS[party]}`);
    if (milestone.inspectorApprovedAt && milestone.supervisorApprovedAt) {
      milestone.status = "closed";
      milestone.closedAt = now;
      log(store, actor, project, "Milestone closed in Equait");
    }
    return { rejected: false };
  });

export const resubmitStcMilestone = async (actor: Actor, projectUuid: string): Promise<void> =>
  transact((store) => {
    const project = editableProject(store, actor, projectUuid);
    const milestone = stcOf(project).milestone;
    if (milestone.status !== "rejected") {
      throw new Error("Only a rejected Milestone is resubmitted");
    }
    milestone.status = "open";
    milestone.rejectionReason = undefined;
    log(store, actor, project, "Milestone resubmitted");
  });
