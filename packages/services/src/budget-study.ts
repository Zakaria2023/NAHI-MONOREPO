import { generateUuid, round2, sumBy, toIso } from "utils";
import { ApplyStudyInput, ScheduleItemInput, StudyLineInput } from "validators";
import { readStore, transact } from "../../../db";
import { BudgetCategory, budgetCategories } from "../../../db/enum";
import { BUDGET_CATEGORY_LABELS } from "../../../db/label";
import { BudgetScheduleItem, BudgetStudyLine, Project, ProjectBudget, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertRole, findOrThrow } from "./core/lookup";
import { BUDGET_EDITORS } from "./core/roles";
import { budgetUsage, saveBudgetLines } from "./budgets";
import { Variance, studyLineAmount, studyTotals, varianceOf } from "./rules/costs";

// THE BUDGET STUDY (finance §4, "the study"): the detailed lines behind each
// budget category — civil and fiber works, materials, equipment with how it is
// supplied, manpower by job title — the timelines for materials, manpower and
// equipment, and the variance of each category's actual cost against the study.

export type StudyCategoryRow = Variance & {
  category: BudgetCategory;
  study: number;
  /** What the budget's planned line says today. */
  budgeted: number;
  committed: number;
};

export type BudgetStudyView = {
  project: Pick<Project, "uuid" | "code" | "name" | "poValue">;
  status: ProjectBudget["status"] | null;
  lines: (BudgetStudyLine & { amount: number })[];
  categories: StudyCategoryRow[];
  schedule: BudgetScheduleItem[];
  studyTotal: number;
  /** Whether applying the study would change the planned lines. */
  differsFromBudget: boolean;
};

const STUDY_EDITORS = [...BUDGET_EDITORS, "project_manager", "system_admin"] as const;

const budgetFor = (store: Store, projectUuid: string): ProjectBudget => {
  findOrThrow(store.Projects, projectUuid, "Project");
  const existing = store.ProjectBudgets.find((b) => b.projectUuid === projectUuid);
  if (existing) {
    return existing;
  }
  const budget: ProjectBudget = { uuid: generateUuid(), projectUuid, status: "draft", lines: [], revisions: [] };
  store.ProjectBudgets.push(budget);
  return budget;
};

const log = (store: Store, actor: Actor, projectUuid: string, action: string, detail?: string) =>
  logActivity(store, {
    actorName: actor.name,
    entity: "budget",
    entityUuid: projectUuid,
    entityLabel: findOrThrow(store.Projects, projectUuid, "Project").code,
    action,
    detail,
  });

export const getBudgetStudy = async (projectUuid: string): Promise<BudgetStudyView> => {
  const store = readStore();
  const project = findOrThrow(store.Projects, projectUuid, "Project");
  const budget = store.ProjectBudgets.find((b) => b.projectUuid === projectUuid);
  const lines = budget?.study ?? [];
  const totals = studyTotals(lines);
  const usage = budgetUsage(store, projectUuid);
  const categories = budgetCategories
    .map((category) => {
      const used = usage.find((u) => u.category === category);
      const study = totals[category] ?? 0;
      return {
        category,
        study,
        budgeted: used?.planned ?? 0,
        committed: used?.committed ?? 0,
        ...varianceOf(study, used?.actual ?? 0),
      };
    })
    .filter((c) => c.study > 0 || c.budgeted > 0 || c.actual > 0);
  return {
    project: { uuid: project.uuid, code: project.code, name: project.name, poValue: project.poValue },
    status: budget?.status ?? null,
    lines: lines.map((l) => ({ ...l, amount: studyLineAmount(l) })),
    categories,
    schedule: [...(budget?.schedule ?? [])].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    studyTotal: round2(sumBy(lines, studyLineAmount)),
    differsFromBudget:
      lines.length > 0 && budgetCategories.some((c) => (totals[c] ?? 0) !== (budget?.lines.find((l) => l.category === c)?.planned ?? 0)),
  };
};

export const addStudyLine = async (actor: Actor, projectUuid: string, input: StudyLineInput): Promise<void> => {
  assertRole(actor.role, [...STUDY_EDITORS], "edit the budget study");
  transact((store) => {
    const budget = budgetFor(store, projectUuid);
    const line: BudgetStudyLine = {
      uuid: generateUuid(),
      category: input.category,
      description: input.description,
      unit: input.unit,
      qty: input.qty,
      unitCost: round2(input.unitCost),
      duration: input.duration > 0 ? input.duration : undefined,
      supplyType: input.supplyType || undefined,
      workType: input.workType || undefined,
    };
    budget.study = [...(budget.study ?? []), line];
    log(store, actor, projectUuid, "Study line added", `${BUDGET_CATEGORY_LABELS[line.category]} — ${line.description}`);
  });
};

export const removeStudyLine = async (actor: Actor, projectUuid: string, lineUuid: string): Promise<void> => {
  assertRole(actor.role, [...STUDY_EDITORS], "edit the budget study");
  transact((store) => {
    const budget = budgetFor(store, projectUuid);
    const line = findOrThrow(budget.study ?? [], lineUuid, "Study line");
    budget.study = (budget.study ?? []).filter((l) => l.uuid !== lineUuid);
    log(store, actor, projectUuid, "Study line removed", line.description);
  });
};

export const addScheduleItem = async (actor: Actor, projectUuid: string, input: ScheduleItemInput): Promise<void> => {
  assertRole(actor.role, [...STUDY_EDITORS], "edit the budget study");
  transact((store) => {
    const budget = budgetFor(store, projectUuid);
    budget.schedule = [
      ...(budget.schedule ?? []),
      { uuid: generateUuid(), resource: input.resource, description: input.description, startsAt: toIso(input.startsAt), endsAt: toIso(input.endsAt) },
    ];
    log(store, actor, projectUuid, "Timeline row added", input.description);
  });
};

export const removeScheduleItem = async (actor: Actor, projectUuid: string, itemUuid: string): Promise<void> => {
  assertRole(actor.role, [...STUDY_EDITORS], "edit the budget study");
  transact((store) => {
    const budget = budgetFor(store, projectUuid);
    findOrThrow(budget.schedule ?? [], itemUuid, "Timeline row");
    budget.schedule = (budget.schedule ?? []).filter((s) => s.uuid !== itemUuid);
    log(store, actor, projectUuid, "Timeline row removed");
  });
};

/**
 * Writes the study's category totals as the budget's planned lines. On an
 * approved budget this is a revision like any other: the projects or finance
 * manager only, with the reason kept.
 */
export const applyStudyToBudget = async (actor: Actor, projectUuid: string, input: ApplyStudyInput): Promise<void> => {
  const store = readStore();
  const budget = store.ProjectBudgets.find((b) => b.projectUuid === projectUuid);
  const lines = budget?.study ?? [];
  if (lines.length === 0) {
    throw new Error("The study has no lines yet");
  }
  const totals = studyTotals(lines);
  await saveBudgetLines(actor, projectUuid, {
    lines: budgetCategories.map((category) => ({ category, planned: totals[category] ?? 0 })),
    reason: input.reason?.trim() || "Budget study applied",
  });
};
