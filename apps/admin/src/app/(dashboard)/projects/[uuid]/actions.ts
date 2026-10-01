"use server";

import {
  addMobilyLabTest,
  addMobilyPermit,
  advanceStcStage,
  approveStcMilestone,
  assignStcInspector,
  createCertificateInvoice,
  decideStcDocument,
  issueMobilyPermit,
  recordCustomerCollection,
  recordMobilyLabTestResult,
  recordMobilyStep,
  recordStcDesign,
  recordStcStep,
  resubmitStcMilestone,
  sendStcToSupervisor,
  setStcMilestoneFlags,
  uploadStcDocument,
} from "services";
import {
  addLabTestSchema,
  addPermitSchema,
  assignInspectorSchema,
  certificateInvoiceSchema,
  collectionSchema,
  issuePermitSchema,
  labTestResultSchema,
  milestoneFlagsSchema,
  mobilyStepSchema,
  stcDecisionSchema,
  stcDesignSchema,
  stcStepSchema,
  stcUploadSchema,
} from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Every action here is bound to its project in the page (`action.bind(null, uuid)`).

// ─── Mobily ────────────────────────────────────────────────────────────────

export const recordMobilyStepAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordMobilyStep(actor, uuid, input), { schema: mobilyStepSchema, success: "Step recorded" });

export const addPermitAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => addMobilyPermit(actor, uuid, input), { schema: addPermitSchema, success: "Permit requested" });

export const issuePermitAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => issueMobilyPermit(actor, uuid, input), { schema: issuePermitSchema, success: "Permit issued" });

export const addLabTestAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => addMobilyLabTest(actor, uuid, input), { schema: addLabTestSchema, success: "Lab test added" });

export const labTestResultAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordMobilyLabTestResult(actor, uuid, input), { schema: labTestResultSchema, success: "Result recorded" });

export const certificateInvoiceAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createCertificateInvoice(actor, uuid, input), { schema: certificateInvoiceSchema, success: "Invoice submitted" });

export const collectInvoiceAction = async (invoiceUuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordCustomerCollection(actor, invoiceUuid, input), { schema: collectionSchema, success: "Collection recorded" });

// ─── STC ───────────────────────────────────────────────────────────────────

export const recordDesignAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordStcDesign(actor, uuid, input), { schema: stcDesignSchema, success: "Design recorded" });

export const advanceStageAction = async (uuid: string) =>
  runAction(undefined, (actor) => advanceStcStage(actor, uuid), { success: "Moved to the next stage" });

export const uploadDocumentAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => uploadStcDocument(actor, uuid, input), { schema: stcUploadSchema, success: "Uploaded" });

export const decideDocumentAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decideStcDocument(actor, uuid, input), { schema: stcDecisionSchema, success: "Decision recorded" });

/** One party's decision on one document — the key and party are bound, the form sends the decision. */
export const decideDocumentPartyAction = async (
  uuid: string,
  key: string,
  party: string,
  _prev: ActionResult,
  data: { decision: "approved" | "rejected"; note?: string },
) =>
  runAction({ key, party, ...data }, (actor, input) => decideStcDocument(actor, uuid, input), {
    schema: stcDecisionSchema,
    success: "Decision recorded",
  });

export const sendToSupervisorAction = async (uuid: string) =>
  runAction(undefined, (actor) => sendStcToSupervisor(actor, uuid), { success: "Sent to the Supervisor" });

export const assignInspectorAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => assignStcInspector(actor, uuid, input), { schema: assignInspectorSchema, success: "Inspector assigned" });

export const stcStepAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordStcStep(actor, uuid, input), { schema: stcStepSchema, success: "Recorded" });

export const milestoneFlagsAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => setStcMilestoneFlags(actor, uuid, input), { schema: milestoneFlagsSchema, success: "Milestone updated" });

export const approveMilestoneAction = async (uuid: string, party: "inspector" | "supervisor") =>
  runAction(undefined, async (actor) => {
    const result = await approveStcMilestone(actor, uuid, party);
    if (result.rejected) {
      throw new Error("The Milestone was rejected automatically: no C09 for the increased quantity / new UPL (rule 6)");
    }
  }, { success: "Milestone approval recorded" });

export const resubmitMilestoneAction = async (uuid: string) =>
  runAction(undefined, (actor) => resubmitStcMilestone(actor, uuid), { success: "Milestone resubmitted" });
