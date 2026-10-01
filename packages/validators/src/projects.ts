import { z } from "zod";
import {
  certificateKinds,
  labTestStatuses,
  labTestSubjects,
  laboratories,
  mobilySteps,
  operators,
  permitAuthorities,
  regions,
  stcDocuments,
  stcM3Checks,
  stcParties,
  stcPatSteps,
  approvalDecisions,
} from "../../../db/enum";
import { dateField, money, optionalNote, requiredText } from "./common";

export const createProjectSchema = z.object({
  name: requiredText("Name"),
  operator: z.enum(operators),
  region: z.enum(regions),
  city: requiredText("City"),
  siteName: requiredText("Site"),
  poNumber: z.string().trim().max(60).optional(),
  poValue: money,
  projectManagerName: requiredText("Project manager"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const mobilyStepSchema = z.object({
  step: z.enum(mobilySteps),
  at: dateField,
  note: optionalNote,
  /** Only read for `po_received` — the PO the step records. */
  poNumber: z.string().trim().max(60).optional(),
});

export type MobilyStepInput = z.infer<typeof mobilyStepSchema>;

export const addPermitSchema = z.object({
  authority: z.enum(permitAuthorities),
  reference: requiredText("Reference"),
  requestedAt: dateField,
  durationDays: z.coerce.number<string | number>().int().positive("Duration must be at least a day"),
});

export type AddPermitInput = z.infer<typeof addPermitSchema>;

export const issuePermitSchema = z.object({
  permitUuid: z.string().min(1),
  issuedAt: dateField,
});

export type IssuePermitInput = z.infer<typeof issuePermitSchema>;

export const addLabTestSchema = z.object({
  lab: z.enum(laboratories),
  subject: z.enum(labTestSubjects),
});

export type AddLabTestInput = z.infer<typeof addLabTestSchema>;

export const labTestResultSchema = z.object({
  testUuid: z.string().min(1),
  status: z.enum(labTestStatuses),
  testedAt: dateField,
  note: optionalNote,
});

export type LabTestResultInput = z.infer<typeof labTestResultSchema>;

export const certificateInvoiceSchema = z.object({
  kind: z.enum(certificateKinds),
  amount: money.refine((v) => v > 0, "Amount must be more than 0"),
  submittedAt: dateField,
});

export type CertificateInvoiceInput = z.infer<typeof certificateInvoiceSchema>;

export const stcDesignSchema = z.object({
  designClosedAt: dateField,
  /** A timestamp, not a date: the 24-hour wait is counted from it. */
  designEndDate: z.string().min(1, "Enter the End Date"),
});

export type StcDesignInput = z.infer<typeof stcDesignSchema>;

export const stcUploadSchema = z.object({
  key: z.enum(stcDocuments),
  fileName: requiredText("File name"),
});

export type StcUploadInput = z.infer<typeof stcUploadSchema>;

export const stcDecisionSchema = z
  .object({
    key: z.enum(stcDocuments),
    party: z.enum(stcParties),
    decision: z.enum(approvalDecisions),
    note: optionalNote,
  })
  .refine((v) => v.decision === "approved" || Boolean(v.note?.trim()), {
    message: "A rejection needs a reason",
    path: ["note"],
  });

export type StcDecisionInput = z.infer<typeof stcDecisionSchema>;

export const assignInspectorSchema = z.object({
  inspectorName: requiredText("Inspector"),
});

export type AssignInspectorInput = z.infer<typeof assignInspectorSchema>;

export const stcStepSchema = z.object({
  step: z.union([z.enum(stcPatSteps), z.enum(stcM3Checks)]),
  at: dateField,
});

export type StcStepInput = z.infer<typeof stcStepSchema>;

export const milestoneFlagsSchema = z.object({
  qtyIncreased: z.boolean(),
  newUpl: z.boolean(),
});

export type MilestoneFlagsInput = z.infer<typeof milestoneFlagsSchema>;
