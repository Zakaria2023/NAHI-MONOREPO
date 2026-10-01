import { addDays, addYears, isPast } from "utils";
import {
  CertificateKind,
  MobilyStage,
  MobilyStep,
  laboratories,
  mobilyStages,
} from "../../../../db/enum";
import {
  LABORATORY_LABELS,
  MOBILY_STAGE_LABELS,
  MOBILY_STEP_LABELS,
} from "../../../../db/label";
import { CustomerInvoice, MobilyPermit, MobilyWorkflow } from "../../../../db/types";

// THE MOBILY RULES (docs/mobily-workflow.md, section 6), as pure functions over
// a project's workflow. Services call them before every change; the admin calls
// them to say why a button is disabled.

export type MobilyContext = {
  workflow: MobilyWorkflow;
  poNumber?: string;
  /** This project's customer invoices — the certificate invoices live there. */
  invoices: CustomerInvoice[];
  /** When the change is happening. A backdated step is checked at its own date. */
  now: string;
};

export type MobilyStageView = {
  stage: MobilyStage;
  complete: boolean;
};

/** Days Mobily takes to pay an invoice once it is on I-Supplier (rule 8). */
export const MOBILY_PAYMENT_DAYS = 60;

/** FAC opens one year after the PAC certificate (rule 6). */
export const FAC_WAIT_YEARS = 1;

/** Final Clearance comes two years after Stage 2 (rule 9). */
export const FINAL_CLEARANCE_YEARS = 2;

/**
 * Default share of the PO value invoiced at each certificate. Not in the source
 * document — a starting value for the invoice form, which the accountant can
 * change.
 */
export const MOBILY_CERTIFICATE_SPLIT: Record<CertificateKind, number> = {
  rfs: 0.7,
  pac: 0.2,
  fac: 0.1,
};

/** Which dated steps belong to each stage. Permits and invoicing have records instead. */
export const MOBILY_STAGE_STEPS: Record<MobilyStage, MobilyStep[]> = {
  design_request: ["site_survey", "design_package"],
  po_issue: ["pr_requested", "po_received"],
  mobilization: ["materials_delivered", "equipment_ready", "manpower_ready"],
  permits: [],
  implementation: [
    "trench_excavation",
    "pipe_laying",
    "mh_installation",
    "concrete_backfilling",
    "concrete_samples",
    "milling_paving",
    "cable_pulling_splicing",
  ],
  pat: ["pat_submitted"],
  site_ho: ["mandrel_test", "foc_e2e_test", "otdr_test", "oil_sheet_signed"],
  permit_ho: ["completion_certificate", "party_clearance", "final_clearance"],
  remedy: ["remedy_requested", "remedy_approved"],
  pcr_sdn: ["pcr_requested", "sdn_approved", "as_built_submitted"],
  certificates: [
    "rfs_submitted",
    "rfs_received",
    "pac_submitted",
    "pac_received",
    "fac_submitted",
    "fac_received",
  ],
  invoicing: [],
  po_closure: ["po_closure_submitted", "po_closed"],
};

/** The step a certificate counts as received at. */
export const CERTIFICATE_RECEIVED_STEP: Record<CertificateKind, MobilyStep> = {
  rfs: "rfs_received",
  pac: "pac_received",
  fac: "fac_received",
};

const has = (ctx: MobilyContext, step: MobilyStep): boolean =>
  ctx.workflow.steps[step] !== undefined;

const missing = (ctx: MobilyContext, steps: MobilyStep[]): MobilyStep[] =>
  steps.filter((step) => !has(ctx, step));

const needSteps = (ctx: MobilyContext, steps: MobilyStep[]): string | null => {
  const absent = missing(ctx, steps);
  return absent.length === 0
    ? null
    : `Needs: ${absent.map((step) => MOBILY_STEP_LABELS[step]).join(", ")}`;
};

/** Rule 2: the expected end date, from the issue date (or the request, until issued). */
export const permitExpiry = (permit: MobilyPermit): string =>
  addDays(permit.issuedAt ?? permit.requestedAt, permit.durationDays);

export const isPermitValid = (permit: MobilyPermit, now: string): boolean =>
  permit.issuedAt !== undefined && !isPast(permitExpiry(permit), now);

/** Rule 6: the first day a FAC request may be opened, or null before PAC. */
export const facEligibleAt = (workflow: MobilyWorkflow): string | null => {
  const pac = workflow.steps.pac_received;
  return pac ? addYears(pac.at, FAC_WAIT_YEARS) : null;
};

/** Rule 9: when the Final Clearance Certificate falls due, or null before Stage 2. */
export const finalClearanceDueAt = (workflow: MobilyWorkflow): string | null => {
  const stage2 = workflow.steps.party_clearance;
  return stage2 ? addYears(stage2.at, FINAL_CLEARANCE_YEARS) : null;
};

/** Rule 8. */
export const invoiceDueAt = (submittedAt: string): string =>
  addDays(submittedAt, MOBILY_PAYMENT_DAYS);

const labTestsPassed = (ctx: MobilyContext): string | null => {
  const tests = ctx.workflow.labTests;
  const notPassed = tests.filter((t) => t.status !== "passed");
  if (notPassed.length > 0) {
    return `${notPassed.length} lab test(s) not passed yet`;
  }
  const labsMissing = laboratories.filter((lab) => !tests.some((t) => t.lab === lab));
  return labsMissing.length === 0
    ? null
    : `Needs a passed test from: ${labsMissing.map((lab) => LABORATORY_LABELS[lab]).join(", ")}`;
};

export const isMobilyStageComplete = (stage: MobilyStage, ctx: MobilyContext): boolean => {
  if (stage === "permits") {
    return ctx.workflow.permits.length > 0 && ctx.workflow.permits.every((p) => p.issuedAt);
  }
  if (stage === "invoicing") {
    return (["rfs", "pac", "fac"] as const).every((kind) =>
      ctx.invoices.some((invoice) => invoice.basis === kind),
    );
  }
  if (stage === "permit_ho") {
    // Stage 3 arrives two years later and is tracked by its own alert; holding
    // the project's "current stage" there for two years would hide everything
    // that happens in between.
    return has(ctx, "completion_certificate") && has(ctx, "party_clearance");
  }
  return missing(ctx, MOBILY_STAGE_STEPS[stage]).length === 0;
};

export const mobilyStageViews = (ctx: MobilyContext): MobilyStageView[] =>
  mobilyStages.map((stage) => ({ stage, complete: isMobilyStageComplete(stage, ctx) }));

/** The first stage that is not complete, or "closed" once the PO is closed. */
export const mobilyCurrentStage = (ctx: MobilyContext): MobilyStage | "closed" =>
  mobilyStages.find((stage) => !isMobilyStageComplete(stage, ctx)) ?? "closed";

/**
 * Why `step` cannot be recorded now, or null when it can. Every numbered rule of
 * section 6 that gates a step is here; the comment on each says which.
 */
export const mobilyStepBlocker = (step: MobilyStep, ctx: MobilyContext): string | null => {
  if (has(ctx, step)) {
    return "Already recorded";
  }
  switch (step) {
    case "site_survey":
      return null;
    case "design_package":
      return needSteps(ctx, ["site_survey"]);
    case "pr_requested":
      return needSteps(ctx, ["design_package"]);
    case "po_received":
      return needSteps(ctx, ["pr_requested"]);
    case "materials_delivered":
    case "equipment_ready":
    case "manpower_ready":
      // Rule 1: mobilization is linked to an issued PO.
      return has(ctx, "po_received") && ctx.poNumber
        ? null
        : "Mobilization needs the PO to be received first (rule 1)";
    case "trench_excavation": {
      if (!isMobilyStageComplete("mobilization", ctx)) {
        return "Mobilization is not complete";
      }
      return ctx.workflow.permits.some((p) => isPermitValid(p, ctx.now))
        ? null
        : "Works need at least one issued, unexpired permit";
    }
    case "pipe_laying":
      return needSteps(ctx, ["trench_excavation"]);
    case "mh_installation":
      return needSteps(ctx, ["trench_excavation"]);
    case "concrete_backfilling":
      return needSteps(ctx, ["pipe_laying", "mh_installation"]);
    case "concrete_samples":
      return needSteps(ctx, ["concrete_backfilling"]);
    case "milling_paving":
      return needSteps(ctx, ["concrete_backfilling", "concrete_samples"]);
    case "cable_pulling_splicing":
      return needSteps(ctx, ["pipe_laying", "mh_installation"]);
    case "pat_submitted":
      // Rule 3 shows each lab's status; PAT is where they must all have passed.
      return needSteps(ctx, MOBILY_STAGE_STEPS.implementation) ?? labTestsPassed(ctx);
    case "mandrel_test":
    case "foc_e2e_test":
    case "otdr_test":
      return needSteps(ctx, ["pat_submitted"]);
    case "oil_sheet_signed":
      return needSteps(ctx, ["mandrel_test", "foc_e2e_test", "otdr_test"]);
    case "completion_certificate":
      return needSteps(ctx, ["oil_sheet_signed"]);
    case "party_clearance":
      return needSteps(ctx, ["completion_certificate"]);
    case "final_clearance": {
      // Rule 9: Stage 3 comes two years after Stage 2.
      const due = finalClearanceDueAt(ctx.workflow);
      if (!due) {
        return needSteps(ctx, ["party_clearance"]);
      }
      return isPast(due, ctx.now) ? null : "Final Clearance is due two years after Stage 2 (rule 9)";
    }
    case "remedy_requested":
      // Rule 4.
      return has(ctx, "oil_sheet_signed")
        ? null
        : "Remedy Approval cannot be requested before the Oil Sheet is signed (rule 4)";
    case "remedy_approved":
      return needSteps(ctx, ["remedy_requested"]);
    case "pcr_requested":
      return needSteps(ctx, ["remedy_approved"]);
    case "sdn_approved":
    case "as_built_submitted":
      return needSteps(ctx, ["pcr_requested"]);
    case "rfs_submitted":
      return isMobilyStageComplete("pcr_sdn", ctx)
        ? null
        : `${MOBILY_STAGE_LABELS.pcr_sdn} is not complete`;
    case "rfs_received":
      return needSteps(ctx, ["rfs_submitted"]);
    case "pac_submitted":
      // Rule 5.
      return has(ctx, "rfs_received")
        ? null
        : "A PAC request cannot be opened before the RFS certificate is received (rule 5)";
    case "pac_received":
      return needSteps(ctx, ["pac_submitted"]);
    case "fac_submitted": {
      // Rule 6.
      const eligible = facEligibleAt(ctx.workflow);
      if (!has(ctx, "rfs_received") || !eligible) {
        return "A FAC request needs both the RFS and PAC certificates (rule 6)";
      }
      return isPast(eligible, ctx.now)
        ? null
        : "A FAC request opens one year after the PAC certificate (rule 6)";
    }
    case "fac_received":
      return needSteps(ctx, ["fac_submitted"]);
    case "po_closure_submitted":
      // Rule 10.
      return has(ctx, "rfs_received") && has(ctx, "pac_received") && has(ctx, "fac_received")
        ? null
        : "PO closure needs the RFS, PAC and FAC certificates (rule 10)";
    case "po_closed":
      return needSteps(ctx, ["po_closure_submitted"]);
  }
};

/** Rule 7: why an invoice for `kind` cannot be created, or null. */
export const certificateInvoiceBlocker = (
  kind: CertificateKind,
  ctx: MobilyContext,
): string | null => {
  if (!has(ctx, CERTIFICATE_RECEIVED_STEP[kind])) {
    return `The ${kind.toUpperCase()} invoice needs the ${kind.toUpperCase()} certificate first (rule 7)`;
  }
  if (ctx.invoices.some((invoice) => invoice.basis === kind)) {
    return `The ${kind.toUpperCase()} invoice already exists`;
  }
  return null;
};

/** What is still missing in the current stage — the per-PO dashboard's list. */
export const mobilyMissingItems = (ctx: MobilyContext): string[] => {
  const stage = mobilyCurrentStage(ctx);
  if (stage === "closed") {
    return [];
  }
  if (stage === "permits") {
    return ctx.workflow.permits.length === 0
      ? ["No permit requested yet"]
      : ctx.workflow.permits
          .filter((p) => !p.issuedAt)
          .map((p) => `Permit ${p.reference} not issued`);
  }
  if (stage === "invoicing") {
    return (["rfs", "pac", "fac"] as const)
      .filter((kind) => !ctx.invoices.some((invoice) => invoice.basis === kind))
      .map((kind) => `${kind.toUpperCase()} invoice not created`);
  }
  const steps = MOBILY_STAGE_STEPS[stage].filter(
    (step) => !has(ctx, step) && !(stage === "permit_ho" && step === "final_clearance"),
  );
  const items = steps.map((step) => MOBILY_STEP_LABELS[step]);
  if (stage === "implementation" || stage === "pat") {
    const failing = labTestsPassed(ctx);
    return failing ? [...items, failing] : items;
  }
  return items;
};
