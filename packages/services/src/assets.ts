import { generateUuid, nextDocumentNumber, nowIso, round2, sumBy, toIso } from "utils";
import {
  AssetCountInput,
  AssetDisposalInput,
  AssetTransferInput,
  DepreciationPostingInput,
  FixedAssetInput,
} from "validators";
import { readStore, transact } from "../../../db";
import { ASSET_DISPOSAL_KIND_LABELS } from "../../../db/label";
import { AssetHolder, DepreciationRun, FixedAsset, Project, Store } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertNotFuture, assertRole, findOrThrow } from "./core/lookup";
import { FINANCE_EDITORS, WAREHOUSE_EDITORS } from "./core/roles";
import {
  ScheduleYear,
  accumulatedAt,
  bookValueAt,
  chargeFor,
  depreciationSchedule,
  disposalGainLoss,
  monthlyCharge,
} from "./rules/assets";

// FIXED ASSETS (finance §7): the asset card, straight-line depreciation worked
// out by the system, transfers between warehouses and employees, the annual
// count, and sale or scrapping with its gain or loss. A month's depreciation is
// posted once; the closing checklist will not tick depreciation without it.

export type FixedAssetRow = FixedAsset & {
  holderLabel: string;
  projectCode?: Project["code"];
  monthly: number;
  accumulated: number;
  bookValue: number;
  /** Counted this calendar year — the annual count's progress. */
  countedThisYear: boolean;
};

export type FixedAssetDetail = {
  asset: FixedAssetRow;
  schedule: ScheduleYear[];
  /** Transfers with both ends named — a warehouse code or the employee. */
  transfers: { at: string; by: string; from: string; to: string; note?: string }[];
};

export type DepreciationLine = {
  asset: Pick<FixedAsset, "uuid" | "number" | "name" | "category">;
  projectCode: string;
  amount: number;
  bookValueAfter: number;
};

export type DepreciationMonth = {
  period: string;
  lines: DepreciationLine[];
  total: number;
  posted: Pick<DepreciationRun, "postedAt" | "postedBy"> | null;
};

const ASSET_EDITORS = [...FINANCE_EDITORS];
const COUNTERS = [...FINANCE_EDITORS, ...WAREHOUSE_EDITORS];

const holderLabel = (store: Store, holder: AssetHolder): string =>
  holder.kind === "warehouse"
    ? (store.Warehouses.find((w) => w.uuid === holder.warehouseUuid)?.code ?? "Warehouse")
    : (holder.employeeName ?? "Employee");

const toRow = (store: Store, asset: FixedAsset, now: string): FixedAssetRow => {
  const period = now.slice(0, 7);
  return {
    ...asset,
    holderLabel: holderLabel(store, asset.holder),
    projectCode: asset.projectUuid ? store.Projects.find((p) => p.uuid === asset.projectUuid)?.code : undefined,
    monthly: monthlyCharge(asset),
    accumulated: accumulatedAt(asset, period),
    bookValue: bookValueAt(asset, period),
    countedThisYear: asset.counts.some((c) => c.at.slice(0, 4) === now.slice(0, 4)),
  };
};

const log = (store: Store, actor: Actor, asset: FixedAsset, action: string, detail?: string) =>
  logActivity(store, { actorName: actor.name, entity: "fixed_asset", entityUuid: asset.uuid, entityLabel: asset.number, action, detail });

const holderFrom = (store: Store, input: { holderKind: AssetHolder["kind"]; warehouseUuid: string; employeeName: string }): AssetHolder => {
  if (input.holderKind === "warehouse") {
    findOrThrow(store.Warehouses, input.warehouseUuid, "Warehouse");
    return { kind: "warehouse", warehouseUuid: input.warehouseUuid };
  }
  return { kind: "employee", employeeName: input.employeeName.trim() };
};

/** A month's depreciation lines, from every asset on the books that month. */
export const depreciationLines = (store: Store, period: string): DepreciationLine[] =>
  store.FixedAssets.map((asset) => ({
    asset: { uuid: asset.uuid, number: asset.number, name: asset.name, category: asset.category },
    projectCode: asset.projectUuid ? (store.Projects.find((p) => p.uuid === asset.projectUuid)?.code ?? "") : "Head office",
    amount: chargeFor(asset, period),
    bookValueAfter: bookValueAt(asset, period),
  })).filter((l) => l.amount > 0);

// ─── Reads ─────────────────────────────────────────────────────────────────

export const listFixedAssets = async (): Promise<FixedAssetRow[]> => {
  const store = readStore();
  const now = nowIso();
  return store.FixedAssets.map((a) => toRow(store, a, now));
};

export const getFixedAsset = async (uuid: string): Promise<FixedAssetDetail> => {
  const store = readStore();
  const asset = findOrThrow(store.FixedAssets, uuid, "Asset");
  return {
    asset: toRow(store, asset, nowIso()),
    schedule: depreciationSchedule(asset),
    transfers: asset.transfers.map((t) => ({ ...t, from: holderLabel(store, t.from), to: holderLabel(store, t.to) })),
  };
};

export const getDepreciationMonth = async (period: string): Promise<DepreciationMonth> => {
  const store = readStore();
  const run = store.DepreciationRuns.find((r) => r.period === period);
  const lines = run
    ? run.lines.map((l) => {
        const asset = findOrThrow(store.FixedAssets, l.assetUuid, "Asset");
        return {
          asset: { uuid: asset.uuid, number: asset.number, name: asset.name, category: asset.category },
          projectCode: asset.projectUuid ? (store.Projects.find((p) => p.uuid === asset.projectUuid)?.code ?? "") : "Head office",
          amount: l.amount,
          bookValueAfter: bookValueAt(asset, period),
        };
      })
    : depreciationLines(store, period);
  return {
    period,
    lines,
    total: round2(sumBy(lines, (l) => l.amount)),
    posted: run ? { postedAt: run.postedAt, postedBy: run.postedBy } : null,
  };
};

export const listDepreciationRuns = async (): Promise<DepreciationRun[]> =>
  [...readStore().DepreciationRuns].sort((a, b) => b.period.localeCompare(a.period));

// ─── Writes ────────────────────────────────────────────────────────────────

/** Step 1: the asset card, created when the asset is received. */
export const registerFixedAsset = async (actor: Actor, input: FixedAssetInput): Promise<FixedAsset> => {
  assertRole(actor.role, ASSET_EDITORS, "register fixed assets");
  const purchaseDate = toIso(input.purchaseDate);
  assertNotFuture(purchaseDate);
  return transact((store) => {
    if (store.FixedAssets.some((a) => a.serialNumber.toLowerCase() === input.serialNumber.toLowerCase())) {
      throw new Error("An asset with this serial number is already registered");
    }
    if (input.projectUuid) {
      findOrThrow(store.Projects, input.projectUuid, "Project");
    }
    const asset: FixedAsset = {
      uuid: generateUuid(),
      number: nextDocumentNumber("FA", store.FixedAssets.map((a) => a.number)),
      name: input.name,
      category: input.category,
      serialNumber: input.serialNumber,
      purchaseDate,
      cost: round2(input.cost),
      salvageValue: round2(input.salvageValue),
      usefulLifeMonths: input.usefulLifeMonths,
      holder: holderFrom(store, input),
      projectUuid: input.projectUuid || undefined,
      status: "active",
      transfers: [],
      counts: [],
      createdBy: actor.name,
      createdAt: nowIso(),
    };
    store.FixedAssets.push(asset);
    log(store, actor, asset, "Asset registered", `${asset.name} — ${asset.serialNumber}`);
    return asset;
  });
};

/** Step 3: moved between warehouses or employees; the card follows it. */
export const transferFixedAsset = async (actor: Actor, uuid: string, input: AssetTransferInput): Promise<void> => {
  assertRole(actor.role, COUNTERS, "transfer assets");
  transact((store) => {
    const asset = findOrThrow(store.FixedAssets, uuid, "Asset");
    if (asset.status !== "active") {
      throw new Error("A disposed asset cannot move");
    }
    const to = holderFrom(store, input);
    const from = asset.holder;
    if (from.kind === to.kind && from.warehouseUuid === to.warehouseUuid && from.employeeName === to.employeeName) {
      throw new Error("The asset is already there");
    }
    asset.transfers.push({ at: nowIso(), by: actor.name, from, to, note: input.note?.trim() || undefined });
    asset.holder = to;
    log(store, actor, asset, "Asset transferred", `${holderLabel(store, from)} → ${holderLabel(store, to)}`);
  });
};

/** Step 4: the annual count — found or missing, and its condition. Once a year per asset. */
export const countFixedAsset = async (actor: Actor, uuid: string, input: AssetCountInput): Promise<void> => {
  assertRole(actor.role, COUNTERS, "count assets");
  transact((store) => {
    const asset = findOrThrow(store.FixedAssets, uuid, "Asset");
    if (asset.status !== "active") {
      throw new Error("A disposed asset is no longer counted");
    }
    const now = nowIso();
    if (asset.counts.some((c) => c.at.slice(0, 4) === now.slice(0, 4))) {
      throw new Error("This asset was already counted this year");
    }
    asset.counts.push({ at: now, by: actor.name, found: input.found, condition: input.condition });
    log(store, actor, asset, input.found ? "Counted — found" : "Counted — missing", input.condition);
  });
};

/** Step 5: sold or scrapped — off the books, with the gain or loss against its book value. */
export const disposeFixedAsset = async (actor: Actor, uuid: string, input: AssetDisposalInput): Promise<void> => {
  assertRole(actor.role, ASSET_EDITORS, "dispose of assets");
  const at = toIso(input.disposedAt);
  assertNotFuture(at);
  transact((store) => {
    const asset = findOrThrow(store.FixedAssets, uuid, "Asset");
    if (asset.status !== "active") {
      throw new Error("The asset is already disposed of");
    }
    if (at < asset.purchaseDate) {
      throw new Error("An asset cannot be disposed of before it was bought");
    }
    if (input.kind === "scrap" && input.proceeds > 0) {
      throw new Error("A scrapped asset brings no proceeds — record it as a sale");
    }
    const { bookValue, gainLoss } = disposalGainLoss(asset, at, input.proceeds);
    asset.status = "disposed";
    asset.disposal = { at, by: actor.name, kind: input.kind, proceeds: round2(input.proceeds), bookValue, gainLoss, note: input.note?.trim() || undefined };
    log(
      store,
      actor,
      asset,
      `${ASSET_DISPOSAL_KIND_LABELS[input.kind]} — off the books`,
      `Book value ${bookValue.toFixed(2)}, ${gainLoss >= 0 ? "gain" : "loss"} ${Math.abs(gainLoss).toFixed(2)}`,
    );
  });
};

/** Posts a month's depreciation once. Not ahead of the month, and not twice. */
export const postDepreciation = async (actor: Actor, input: DepreciationPostingInput): Promise<DepreciationRun> => {
  assertRole(actor.role, ASSET_EDITORS, "post depreciation");
  return transact((store) => {
    if (input.period > nowIso().slice(0, 7)) {
      throw new Error("Depreciation is posted for the current month or an earlier one");
    }
    if (store.DepreciationRuns.some((r) => r.period === input.period)) {
      throw new Error(`Depreciation for ${input.period} is already posted`);
    }
    const lines = depreciationLines(store, input.period);
    if (lines.length === 0) {
      throw new Error("No asset carries depreciation in this month");
    }
    const run: DepreciationRun = {
      uuid: generateUuid(),
      period: input.period,
      lines: lines.map((l) => ({ assetUuid: l.asset.uuid, amount: l.amount })),
      total: round2(sumBy(lines, (l) => l.amount)),
      postedBy: actor.name,
      postedAt: nowIso(),
    };
    store.DepreciationRuns.push(run);
    logActivity(store, {
      actorName: actor.name,
      entity: "depreciation",
      entityUuid: run.uuid,
      entityLabel: run.period,
      action: "Depreciation posted",
      detail: `${lines.length} assets — SAR ${run.total.toFixed(2)}`,
    });
    return run;
  });
};
