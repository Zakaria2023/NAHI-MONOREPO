import { formatMoney, generateUuid, nextDocumentNumber, nowIso, round2, sumBy, toIso } from "utils";
import { ExtractDecisionInput, ExtractInput, SubcontractInput } from "validators";
import { readStore, transact } from "../../../db";
import { ExtractStatus } from "../../../db/enum";
import { Extract, Project, Store, Subcontract, Subcontractor } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { ChainState, chainState, decide } from "./core/approvals";
import { assertRole, findOrThrow } from "./core/lookup";
import { FINANCE_EDITORS } from "./core/roles";
import { EXTRACT_CHAIN } from "./rules/chains";
import { ExtractFigures, extractFigures } from "./rules/finance";

// SUBCONTRACTORS (finance §2). An extract is reviewed by the project engineer,
// then the projects manager, then finance; its deductions — advance, retention,
// penalties, materials issued from the warehouse — are recomputed at every step
// and frozen at the last, so a late issue of materials is not missed.

export type SubcontractRow = Subcontract & {
  subcontractorName: Subcontractor["name"];
  projectCode: Project["code"];
  certified: number;
  retentionHeld: number;
  advanceRecovered: number;
  /** Materials issued to the subcontractor on the project, not yet deducted. */
  materialsPending: number;
};

export type ExtractRow = Extract & {
  subcontractNumber: Subcontract["number"];
  subcontractorName: Subcontractor["name"];
  projectCode: Project["code"];
  awaiting: ChainState["nextRole"];
};

export type ExtractDetail = {
  extract: ExtractRow;
  subcontract: SubcontractRow;
  chain: ChainState;
  /** What the figures would be if approved now. */
  preview: ExtractFigures;
};

export type SubcontractorStatement = {
  subcontractor: Subcontractor;
  subcontracts: SubcontractRow[];
  extracts: ExtractRow[];
  totals: { gross: number; retention: number; materials: number; net: number; paid: number };
};

const COUNTING: ExtractStatus[] = ["submitted", "engineer_approved", "pm_approved", "approved", "paid"];
const FINAL: ExtractStatus[] = ["approved", "paid"];

/** Each approval moves the extract one status on. */
const STATUS_AFTER: ExtractStatus[] = ["engineer_approved", "pm_approved", "approved"];

const SUBCONTRACT_EDITORS = ["system_admin", "projects_manager", "project_manager"] as const;

const materialsIssued = (store: Store, subcontract: Subcontract): number =>
  round2(
    sumBy(
      store.StockMovements.filter(
        (m) =>
          m.type === "issue" &&
          m.projectUuid === subcontract.projectUuid &&
          m.chargedTo?.kind === "subcontractor" &&
          m.chargedTo.subcontractorUuid === subcontract.subcontractorUuid,
      ),
      (m) => -m.qty * m.unitCost,
    ),
  );

/** Deducted on final extracts already, plus what other open extracts have claimed. */
const materialsDeducted = (store: Store, subcontract: Subcontract, exceptUuid?: string): number =>
  round2(
    sumBy(
      store.Extracts.filter(
        (e) => e.subcontractUuid === subcontract.uuid && e.uuid !== exceptUuid && FINAL.includes(e.status),
      ),
      (e) => e.materialsDeduction,
    ),
  );

const advanceRecovered = (store: Store, subcontract: Subcontract, exceptUuid?: string): number =>
  round2(
    sumBy(
      store.Extracts.filter(
        (e) => e.subcontractUuid === subcontract.uuid && e.uuid !== exceptUuid && FINAL.includes(e.status),
      ),
      (e) => e.advanceDeduction,
    ),
  );

const figuresFor = (store: Store, subcontract: Subcontract, extract: Pick<Extract, "uuid" | "lines" | "penalties">) =>
  extractFigures(
    subcontract,
    extract.lines,
    advanceRecovered(store, subcontract, extract.uuid),
    extract.penalties,
    Math.max(0, materialsIssued(store, subcontract) - materialsDeducted(store, subcontract, extract.uuid)),
  );

const toSubcontractRow = (store: Store, s: Subcontract): SubcontractRow => {
  const finals = store.Extracts.filter((e) => e.subcontractUuid === s.uuid && FINAL.includes(e.status));
  return {
    ...s,
    subcontractorName: findOrThrow(store.Subcontractors, s.subcontractorUuid, "Subcontractor").name,
    projectCode: findOrThrow(store.Projects, s.projectUuid, "Project").code,
    certified: round2(sumBy(finals, (e) => e.gross)),
    retentionHeld: round2(sumBy(finals, (e) => e.retention)),
    advanceRecovered: advanceRecovered(store, s),
    materialsPending: round2(Math.max(0, materialsIssued(store, s) - materialsDeducted(store, s))),
  };
};

const toExtractRow = (store: Store, e: Extract): ExtractRow => {
  const s = findOrThrow(store.Subcontracts, e.subcontractUuid, "Subcontract");
  return {
    ...e,
    subcontractNumber: s.number,
    subcontractorName: findOrThrow(store.Subcontractors, s.subcontractorUuid, "Subcontractor").name,
    projectCode: findOrThrow(store.Projects, s.projectUuid, "Project").code,
    awaiting: COUNTING.slice(0, 3).includes(e.status) ? chainState(EXTRACT_CHAIN, e.approvals).nextRole : null,
  };
};

const log = (store: Store, actorName: string, extract: Extract, action: string, detail?: string) =>
  logActivity(store, {
    actorName,
    entity: "extract",
    entityUuid: extract.uuid,
    entityLabel: extract.number,
    action,
    detail,
  });

export const listSubcontractors = async (): Promise<Subcontractor[]> => readStore().Subcontractors;

export const listSubcontracts = async (): Promise<SubcontractRow[]> => {
  const store = readStore();
  return store.Subcontracts.map((s) => toSubcontractRow(store, s));
};

export const listExtracts = async (filter: { subcontractorUuid?: string } = {}): Promise<ExtractRow[]> => {
  const store = readStore();
  return [...store.Extracts]
    .reverse()
    .filter((e) => {
      if (!filter.subcontractorUuid) {
        return true;
      }
      return findOrThrow(store.Subcontracts, e.subcontractUuid, "Subcontract").subcontractorUuid === filter.subcontractorUuid;
    })
    .map((e) => toExtractRow(store, e));
};

export const getExtract = async (uuid: string): Promise<ExtractDetail> => {
  const store = readStore();
  const extract = findOrThrow(store.Extracts, uuid, "Extract");
  const subcontract = findOrThrow(store.Subcontracts, extract.subcontractUuid, "Subcontract");
  return {
    extract: toExtractRow(store, extract),
    subcontract: toSubcontractRow(store, subcontract),
    chain: chainState(EXTRACT_CHAIN, extract.approvals),
    preview: FINAL.includes(extract.status) ? extract : figuresFor(store, subcontract, extract),
  };
};

export const subcontractorStatement = async (subcontractorUuid: string): Promise<SubcontractorStatement> => {
  const store = readStore();
  const subcontractor = findOrThrow(store.Subcontractors, subcontractorUuid, "Subcontractor");
  const subcontracts = store.Subcontracts.filter((s) => s.subcontractorUuid === subcontractorUuid).map((s) =>
    toSubcontractRow(store, s),
  );
  const extracts = store.Extracts.filter((e) => subcontracts.some((s) => s.uuid === e.subcontractUuid))
    .map((e) => toExtractRow(store, e))
    .reverse();
  const finals = extracts.filter((e) => FINAL.includes(e.status));
  return {
    subcontractor,
    subcontracts,
    extracts,
    totals: {
      gross: round2(sumBy(finals, (e) => e.gross)),
      retention: round2(sumBy(finals, (e) => e.retention)),
      materials: round2(sumBy(finals, (e) => e.materialsDeduction)),
      net: round2(sumBy(finals, (e) => e.net)),
      paid: round2(sumBy(finals.filter((e) => e.status === "paid"), (e) => e.net)),
    },
  };
};

export const createSubcontract = async (actor: Actor, input: SubcontractInput): Promise<Subcontract> => {
  assertRole(actor.role, [...SUBCONTRACT_EDITORS], "create subcontracts");
  return transact((store) => {
    findOrThrow(store.Subcontractors, input.subcontractorUuid, "Subcontractor");
    const project = findOrThrow(store.Projects, input.projectUuid, "Project");
    if (input.advancePaid > input.value) {
      throw new Error("The advance cannot exceed the contract value");
    }
    const subcontract: Subcontract = {
      uuid: generateUuid(),
      number: nextDocumentNumber("SC", store.Subcontracts.map((s) => s.number)),
      ...input,
      value: round2(input.value),
      advancePaid: round2(input.advancePaid),
      createdAt: nowIso(),
    };
    store.Subcontracts.push(subcontract);
    logActivity(store, {
      actorName: actor.name,
      entity: "subcontract",
      entityUuid: subcontract.uuid,
      entityLabel: subcontract.number,
      action: "Subcontract created",
      detail: `${project.code} — ${formatMoney(subcontract.value)}`,
    });
    return subcontract;
  });
};

/**
 * §2 step 1. `submittedBy` is the subcontractor (portal) or a staff member
 * entering it for them; who may submit is the caller's concern.
 */
export const submitExtract = async (
  submitter: { name: string; via: Extract["submittedVia"]; subcontractorUuid?: string },
  input: ExtractInput,
): Promise<Extract> =>
  transact((store) => {
    const subcontract = findOrThrow(store.Subcontracts, input.subcontractUuid, "Subcontract");
    if (submitter.subcontractorUuid && submitter.subcontractorUuid !== subcontract.subcontractorUuid) {
      throw new Error("This subcontract is not yours");
    }
    if (input.periodTo < input.periodFrom) {
      throw new Error("The period ends before it starts");
    }
    const draft = { uuid: "", lines: input.lines, penalties: 0 };
    const figures = figuresFor(store, subcontract, draft);
    const certified = sumBy(
      store.Extracts.filter((e) => e.subcontractUuid === subcontract.uuid && e.status !== "rejected"),
      (e) => e.gross,
    );
    if (certified + figures.gross > subcontract.value + 0.005) {
      throw new Error(`Extracts would exceed the subcontract value of ${formatMoney(subcontract.value)}`);
    }
    const extract: Extract = {
      uuid: generateUuid(),
      number: nextDocumentNumber("EX", store.Extracts.map((e) => e.number)),
      subcontractUuid: subcontract.uuid,
      periodFrom: toIso(input.periodFrom),
      periodTo: toIso(input.periodTo),
      lines: input.lines,
      ...figures,
      status: "submitted",
      approvals: [],
      submittedVia: submitter.via,
      submittedBy: submitter.name,
      createdAt: nowIso(),
    };
    store.Extracts.push(extract);
    log(store, submitter.name, extract, "Extract submitted", formatMoney(extract.gross));
    return extract;
  });

/** §2 steps 1–7: engineer → projects manager → finance, recomputing the deductions each time. */
export const decideExtract = async (actor: Actor, uuid: string, input: ExtractDecisionInput): Promise<void> =>
  transact((store) => {
    const extract = findOrThrow(store.Extracts, uuid, "Extract");
    if (!["submitted", "engineer_approved", "pm_approved"].includes(extract.status)) {
      throw new Error("This extract is not waiting for approval");
    }
    extract.approvals = decide(EXTRACT_CHAIN, extract.approvals, {
      actor,
      decision: input.decision,
      note: input.note,
    });
    if (input.decision === "rejected") {
      extract.status = "rejected";
      log(store, actor.name, extract, "Rejected", input.note);
      return;
    }
    if (input.penalties !== undefined) {
      extract.penalties = round2(input.penalties);
      extract.penaltyNote = input.penaltyNote?.trim() || undefined;
    }
    const subcontract = findOrThrow(store.Subcontracts, extract.subcontractUuid, "Subcontract");
    Object.assign(extract, figuresFor(store, subcontract, extract));
    if (extract.net < 0) {
      throw new Error("Deductions exceed the extract's value");
    }
    extract.status = STATUS_AFTER[extract.approvals.length - 1];
    log(
      store,
      actor.name,
      extract,
      extract.status === "approved" ? "Approved — net posted for payment" : "Approved",
      `Net ${formatMoney(extract.net)}`,
    );
  });

export const markExtractPaid = async (actor: Actor, uuid: string): Promise<void> => {
  assertRole(actor.role, FINANCE_EDITORS, "pay extracts");
  transact((store) => {
    const extract = findOrThrow(store.Extracts, uuid, "Extract");
    if (extract.status !== "approved") {
      throw new Error("Only an approved extract is paid");
    }
    extract.status = "paid";
    extract.paidAt = nowIso();
    log(store, actor.name, extract, "Paid", formatMoney(extract.net));
  });
};
