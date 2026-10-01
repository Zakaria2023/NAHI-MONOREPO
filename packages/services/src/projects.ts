import { generateUuid, nextDocumentNumber, nowIso, round2 } from "utils";
import { CreateProjectInput } from "validators";
import { readStore, transact } from "../../../db";
import {
  CertificateKind,
  MobilyStage,
  MobilyStep,
  Operator,
  StcM3Check,
  StcPatStep,
  StcStage,
  mobilySteps,
  stcM3Checks,
  stcPatSteps,
} from "../../../db/enum";
import { MOBILY_STAGE_LABELS, STC_STAGE_LABELS } from "../../../db/label";
import {
  ActivityEntry,
  CustomerInvoice,
  LabTest,
  MobilyPermit,
  MobilyWorkflow,
  Project,
  StcMilestone,
  Store,
} from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertRole, findOrThrow } from "./core/lookup";
import { PROJECT_EDITORS } from "./core/roles";
import {
  MobilyContext,
  MobilyStageView,
  certificateInvoiceBlocker,
  facEligibleAt,
  finalClearanceDueAt,
  mobilyCurrentStage,
  mobilyMissingItems,
  mobilyStageViews,
  mobilyStepBlocker,
  permitExpiry,
} from "./rules/mobily";
import {
  StcDocumentView,
  designWaitEndsAt,
  milestoneApprovalBlocker,
  milestoneWarning,
  stcAdvanceBlocker,
  stcDocumentViews,
  stcMissingItems,
  stcPatStepBlocker,
  stcStageIndex,
} from "./rules/stc";

export type ProjectFilters = {
  operator?: Operator;
  search?: string;
};

export type ProjectListItem = Pick<
  Project,
  "uuid" | "code" | "name" | "operator" | "city" | "siteName" | "poNumber" | "poValue" | "projectManagerName"
> & {
  stageLabel: string;
  /** 0..1 — completed stages over all stages. */
  progress: number;
  missing: string[];
  closed: boolean;
};

export type PermitView = MobilyPermit & {
  expiresAt: string;
};

export type MobilyDetail = {
  stages: MobilyStageView[];
  currentStage: MobilyStage | "closed";
  steps: MobilyWorkflow["steps"];
  /** Why each step cannot be recorded now; absent when it can. */
  stepBlockers: Partial<Record<MobilyStep, string>>;
  permits: PermitView[];
  labTests: LabTest[];
  invoices: CustomerInvoice[];
  invoiceBlockers: Record<CertificateKind, string | null>;
  facEligibleAt: string | null;
  finalClearanceDueAt: string | null;
  missing: string[];
};

export type StcDetail = {
  workflow: NonNullable<Project["stc"]>;
  documents: StcDocumentView[];
  designWaitEndsAt: string | null;
  advanceBlocker: string | null;
  patBlockers: Partial<Record<StcPatStep, string>>;
  checkBlockers: Partial<Record<StcM3Check, string>>;
  milestoneWarning: string | null;
  milestoneBlockers: Record<"inspector" | "supervisor", string | null>;
  milestone: StcMilestone;
  missing: string[];
  invoices: CustomerInvoice[];
};

export type ProjectDetail = {
  project: Project;
  mobily?: MobilyDetail;
  stc?: StcDetail;
  activity: ActivityEntry[];
};

const projectInvoices = (store: Store, projectUuid: string): CustomerInvoice[] =>
  store.CustomerInvoices.filter((invoice) => invoice.projectUuid === projectUuid);

export const mobilyContext = (store: Store, project: Project, now: string): MobilyContext => {
  if (!project.mobily) {
    throw new Error("Not a Mobily project");
  }
  return {
    workflow: project.mobily,
    poNumber: project.poNumber,
    invoices: projectInvoices(store, project.uuid),
    now,
  };
};

const stcStageLabel = (stage: StcStage): string => STC_STAGE_LABELS[stage];

export const toProjectListItem = (store: Store, project: Project, now: string): ProjectListItem => {
  const base = {
    uuid: project.uuid,
    code: project.code,
    name: project.name,
    operator: project.operator,
    city: project.city,
    siteName: project.siteName,
    poNumber: project.poNumber,
    poValue: project.poValue,
    projectManagerName: project.projectManagerName,
  };
  if (project.mobily) {
    const ctx = mobilyContext(store, project, now);
    const stage = mobilyCurrentStage(ctx);
    const views = mobilyStageViews(ctx);
    return {
      ...base,
      stageLabel: stage === "closed" ? "PO closed" : MOBILY_STAGE_LABELS[stage],
      progress: round2(views.filter((v) => v.complete).length / views.length),
      missing: mobilyMissingItems(ctx),
      closed: stage === "closed",
    };
  }
  if (project.stc) {
    const stage = project.stc.stage;
    return {
      ...base,
      stageLabel: stcStageLabel(stage),
      progress: round2(stcStageIndex(stage) / stcStageIndex("completed")),
      missing: stcMissingItems(project.stc, now),
      closed: stage === "completed",
    };
  }
  throw new Error(`Project ${project.code} has no workflow`);
};

export const listProjects = async (filters: ProjectFilters = {}): Promise<ProjectListItem[]> => {
  const store = readStore();
  const now = nowIso();
  const search = filters.search?.trim().toLowerCase();
  return store.Projects.filter((p) => !filters.operator || p.operator === filters.operator)
    .filter(
      (p) =>
        !search ||
        [p.code, p.name, p.siteName, p.city, p.poNumber ?? ""].some((v) => v.toLowerCase().includes(search)),
    )
    .map((p) => toProjectListItem(store, p, now));
};

const mobilyDetail = (store: Store, project: Project, now: string): MobilyDetail => {
  const ctx = mobilyContext(store, project, now);
  const stepBlockers: Partial<Record<MobilyStep, string>> = {};
  for (const step of mobilySteps) {
    const blocker = mobilyStepBlocker(step, ctx);
    if (blocker && blocker !== "Already recorded") {
      stepBlockers[step] = blocker;
    }
  }
  return {
    stages: mobilyStageViews(ctx),
    currentStage: mobilyCurrentStage(ctx),
    steps: ctx.workflow.steps,
    stepBlockers,
    permits: ctx.workflow.permits.map((p) => ({ ...p, expiresAt: permitExpiry(p) })),
    labTests: ctx.workflow.labTests,
    invoices: ctx.invoices,
    invoiceBlockers: {
      rfs: certificateInvoiceBlocker("rfs", ctx),
      pac: certificateInvoiceBlocker("pac", ctx),
      fac: certificateInvoiceBlocker("fac", ctx),
    },
    facEligibleAt: facEligibleAt(ctx.workflow),
    finalClearanceDueAt: finalClearanceDueAt(ctx.workflow),
    missing: mobilyMissingItems(ctx),
  };
};

const stcDetail = (store: Store, project: Project, now: string): StcDetail => {
  const workflow = project.stc;
  if (!workflow) {
    throw new Error("Not an STC project");
  }
  const patBlockers: Partial<Record<StcPatStep, string>> = {};
  for (const step of stcPatSteps) {
    const blocker = stcPatStepBlocker(workflow, step);
    if (blocker && blocker !== "Already recorded") {
      patBlockers[step] = blocker;
    }
  }
  const checkBlockers: Partial<Record<StcM3Check, string>> = {};
  for (const check of stcM3Checks) {
    if (workflow.stage !== "m3" && !workflow.m3Checks[check]) {
      checkBlockers[check] = "Recorded in M3";
    }
  }
  return {
    workflow,
    documents: stcDocumentViews(workflow),
    designWaitEndsAt: designWaitEndsAt(workflow),
    advanceBlocker: stcAdvanceBlocker(workflow, now),
    patBlockers,
    checkBlockers,
    milestoneWarning: milestoneWarning(workflow),
    milestoneBlockers: {
      inspector: milestoneApprovalBlocker(workflow, "inspector"),
      supervisor: milestoneApprovalBlocker(workflow, "supervisor"),
    },
    milestone: workflow.milestone,
    missing: stcMissingItems(workflow, now),
    invoices: projectInvoices(store, project.uuid),
  };
};

export const getProjectDetail = async (uuid: string): Promise<ProjectDetail> => {
  const store = readStore();
  const project = findOrThrow(store.Projects, uuid, "Project");
  const now = nowIso();
  return {
    project,
    mobily: project.mobily ? mobilyDetail(store, project, now) : undefined,
    stc: project.stc ? stcDetail(store, project, now) : undefined,
    activity: store.Activity.filter((a) => a.entity === "project" && a.entityUuid === uuid),
  };
};

/** Projects as `{ uuid, label }` for pickers in other modules. */
export const listProjectOptions = async (): Promise<{ value: string; label: string }[]> =>
  readStore().Projects.map((p) => ({ value: p.uuid, label: `${p.code} — ${p.name}` }));

export const createProject = async (actor: Actor, input: CreateProjectInput): Promise<Project> => {
  assertRole(actor.role, PROJECT_EDITORS, "create projects");
  return transact((store) => {
    const prefix = input.operator === "mobily" ? "MOB" : "STC";
    const code = nextDocumentNumber(prefix, store.Projects.map((p) => p.code), 3);
    const project: Project = {
      uuid: generateUuid(),
      code,
      name: input.name,
      operator: input.operator,
      region: input.region,
      city: input.city,
      siteName: input.siteName,
      poNumber: input.poNumber || undefined,
      poValue: round2(input.poValue),
      projectManagerName: input.projectManagerName,
      createdAt: nowIso(),
      mobily: input.operator === "mobily" ? { steps: {}, permits: [], labTests: [] } : undefined,
      stc:
        input.operator === "stc"
          ? {
              stage: "design",
              patSteps: {},
              m3Checks: {},
              milestone: { qtyIncreased: false, newUpl: false, status: "open" },
              documents: [],
              stageHistory: [],
            }
          : undefined,
    };
    store.Projects.push(project);
    logActivity(store, {
      actorName: actor.name,
      entity: "project",
      entityUuid: project.uuid,
      entityLabel: project.code,
      action: "Project created",
      detail: project.name,
    });
    return project;
  });
};

/** Shared by the Mobily and STC services: the project, checked to be editable by `actor`. */
export const editableProject = (store: Store, actor: Actor, uuid: string): Project => {
  assertRole(actor.role, PROJECT_EDITORS, "change project workflows");
  return findOrThrow(store.Projects, uuid, "Project");
};
