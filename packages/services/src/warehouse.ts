import { addDays, generateUuid, nextDocumentNumber, nowIso, round2, sumBy, toIso } from "utils";
import {
  AssetReturnInput,
  DecisionFormInput,
  IssueRequestInput,
  IssueStockInput,
  ItemInput,
  StocktakeInput,
  TransferInput,
  WriteOffInput,
} from "validators";
import { readStore, transact } from "../../../db";
import { InventoryFrequency, StaffRole } from "../../../db/enum";
import {
  ASSET_CUSTODY_STATUS_LABELS,
  WRITE_OFF_DECISION_LABELS,
  WRITE_OFF_REASON_LABELS,
} from "../../../db/label";
import {
  Approval,
  AssetCustody,
  IssueRequest,
  Item,
  Project,
  StockMovement,
  StockTransfer,
  Stocktake,
  Store,
  Warehouse,
  WriteOff,
} from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { ChainState, chainState, decide } from "./core/approvals";
import { assertNotFuture, assertRole, findOrThrow } from "./core/lookup";
import { REQUESTERS, WAREHOUSE_EDITORS } from "./core/roles";
import { addMovement, assertStockCovers, averageCost, stockBalance } from "./core/stock";
import { ISSUE_CHAIN, STOCKTAKE_CHAIN, TRANSFER_CHAIN, WRITE_OFF_CHAIN } from "./rules/chains";

// THE WAREHOUSE (procurement §2, §3, §5): balances, issues and the custody they
// create, transfers, stocktakes and write-offs.

export type StockRow = Pick<Item, "uuid" | "code" | "name" | "category" | "kind" | "unit" | "reorderLevel"> & {
  /** Per warehouse, keyed by warehouse uuid. */
  byWarehouse: Record<string, number>;
  total: number;
  averageCost: number;
  value: number;
  belowReorder: boolean;
};

export type ItemCardRow = StockMovement & {
  warehouseCode: Warehouse["code"];
  balance: number;
};

export type ItemCard = {
  item: Item;
  rows: ItemCardRow[];
  total: number;
};

export type WarehouseDocRow = {
  uuid: string;
  number: string;
  kind: "issue_request" | "stock_transfer" | "stocktake" | "write_off";
  status: string;
  summary: string;
  createdAt: string;
  awaiting: ChainState["nextRole"];
};

export type LineView = {
  itemUuid: string;
  qty: number;
  item: Pick<Item, "code" | "name" | "unit" | "kind">;
  available: number;
};

export type IssueRequestDetail = {
  request: IssueRequest;
  project: Pick<Project, "uuid" | "code" | "name">;
  warehouse: Warehouse;
  lines: LineView[];
  chain: ChainState;
};

export type TransferDetail = {
  transfer: StockTransfer;
  from: Warehouse;
  to: Warehouse;
  lines: LineView[];
  chain: ChainState;
};

export type StocktakeDetail = {
  stocktake: Stocktake;
  warehouse: Warehouse;
  lines: (Stocktake["lines"][number] & { item: LineView["item"]; difference: number })[];
  chain: ChainState;
};

export type WriteOffDetail = {
  writeOff: WriteOff;
  warehouse: Warehouse;
  lines: LineView[];
  value: number;
  chain: ChainState;
};

export type AssetCustodyRow = AssetCustody & {
  item: Pick<Item, "code" | "name">;
  projectCode: Project["code"];
  nextCountAt: string;
  countOverdue: boolean;
};

const COUNT_INTERVAL_DAYS: Record<InventoryFrequency, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  semiannual: 182,
  annual: 365,
};

const log = (
  store: Store,
  actor: Actor,
  entity: "issue_request" | "stock_transfer" | "stocktake" | "write_off" | "asset_custody",
  uuid: string,
  label: string,
  action: string,
  detail?: string,
) => logActivity(store, { actorName: actor.name, entity, entityUuid: uuid, entityLabel: label, action, detail });

const lineView = (store: Store, warehouseUuid: string) => (line: { itemUuid: string; qty: number }): LineView => {
  const item = findOrThrow(store.Items, line.itemUuid, "Item");
  return {
    itemUuid: line.itemUuid,
    qty: line.qty,
    item: { code: item.code, name: item.name, unit: item.unit, kind: item.kind },
    available: stockBalance(store, line.itemUuid, warehouseUuid),
  };
};

export const nextCountAt = (custody: AssetCustody): string =>
  addDays(custody.lastCountedAt ?? custody.issuedAt, COUNT_INTERVAL_DAYS[custody.inventoryFrequency]);

/** Generic "one approval chain, then do it" for transfers, stocktakes and write-offs. */
const decideWarehouseDoc = <D extends { approvals: Approval[]; status: string }>(
  doc: D,
  chain: StaffRole[],
  actor: Actor,
  input: DecisionFormInput,
): "rejected" | "pending" | "complete" => {
  if (doc.status !== "pending_approval") {
    throw new Error("This document is not waiting for approval");
  }
  doc.approvals = decide(chain, doc.approvals, { actor, ...input });
  const state = chainState(chain, doc.approvals);
  return state.rejected ? "rejected" : state.complete ? "complete" : "pending";
};

// ─── Master data and balances ──────────────────────────────────────────────

export const listWarehouses = async (): Promise<Warehouse[]> => readStore().Warehouses;

export const listItems = async (): Promise<Item[]> => readStore().Items;

export const createItem = async (actor: Actor, input: ItemInput): Promise<Item> => {
  assertRole(actor.role, [...WAREHOUSE_EDITORS, "procurement"], "add items");
  return transact((store) => {
    if (store.Items.some((i) => i.code.toLowerCase() === input.code.trim().toLowerCase())) {
      throw new Error("An item with this code already exists");
    }
    const item: Item = { uuid: generateUuid(), ...input, code: input.code.trim().toUpperCase() };
    store.Items.push(item);
    return item;
  });
};

/** Report: current balance, and the items under their reorder level. */
export const listStock = async (): Promise<StockRow[]> => {
  const store = readStore();
  return store.Items.map((item) => {
    const byWarehouse = Object.fromEntries(
      store.Warehouses.map((w) => [w.uuid, stockBalance(store, item.uuid, w.uuid)]),
    );
    const total = round2(sumBy(Object.values(byWarehouse), (q) => q));
    const cost = averageCost(store, item.uuid);
    return {
      uuid: item.uuid,
      code: item.code,
      name: item.name,
      category: item.category,
      kind: item.kind,
      unit: item.unit,
      reorderLevel: item.reorderLevel,
      byWarehouse,
      total,
      averageCost: cost,
      value: round2(total * cost),
      belowReorder: total < item.reorderLevel,
    };
  });
};

/** Report: the item card — every movement with the running balance. */
export const getItemCard = async (itemUuid: string): Promise<ItemCard> => {
  const store = readStore();
  const item = findOrThrow(store.Items, itemUuid, "Item");
  const movements = store.StockMovements.filter((m) => m.itemUuid === itemUuid).sort((a, b) =>
    a.at.localeCompare(b.at),
  );
  let running = 0;
  const rows = movements.map((m) => {
    running = round2(running + m.qty);
    return {
      ...m,
      warehouseCode: findOrThrow(store.Warehouses, m.warehouseUuid, "Warehouse").code,
      balance: running,
    };
  });
  return { item, rows: rows.reverse(), total: running };
};

export const listWarehouseDocuments = async (): Promise<WarehouseDocRow[]> => {
  const store = readStore();
  const warehouseCode = (uuid: string) => findOrThrow(store.Warehouses, uuid, "Warehouse").code;
  const issues = store.IssueRequests.map((r) => ({
    uuid: r.uuid,
    number: r.number,
    kind: "issue_request" as const,
    status: r.status,
    summary: `${r.recipient.name} — ${findOrThrow(store.Projects, r.projectUuid, "Project").code}`,
    createdAt: r.issuedAt ?? r.approvals[0]?.at ?? "",
    awaiting: r.status === "pending_approval" ? chainState(ISSUE_CHAIN, r.approvals).nextRole : null,
  }));
  const transfers = store.StockTransfers.map((t) => ({
    uuid: t.uuid,
    number: t.number,
    kind: "stock_transfer" as const,
    status: t.status,
    summary: `${warehouseCode(t.fromWarehouseUuid)} → ${warehouseCode(t.toWarehouseUuid)}`,
    createdAt: t.createdAt,
    awaiting: t.status === "pending_approval" ? chainState(TRANSFER_CHAIN, t.approvals).nextRole : null,
  }));
  const stocktakes = store.Stocktakes.map((s) => ({
    uuid: s.uuid,
    number: s.number,
    kind: "stocktake" as const,
    status: s.status,
    summary: `${warehouseCode(s.warehouseUuid)} — ${s.lines.length} item(s) counted`,
    createdAt: s.countedAt,
    awaiting: s.status === "pending_approval" ? chainState(STOCKTAKE_CHAIN, s.approvals).nextRole : null,
  }));
  const writeOffs = store.WriteOffs.map((w) => ({
    uuid: w.uuid,
    number: w.number,
    kind: "write_off" as const,
    status: w.status,
    summary: `${warehouseCode(w.warehouseUuid)} — ${WRITE_OFF_REASON_LABELS[w.reason]}`,
    createdAt: w.createdAt,
    awaiting: w.status === "pending_approval" ? chainState(WRITE_OFF_CHAIN, w.approvals).nextRole : null,
  }));
  return [...issues, ...transfers, ...stocktakes, ...writeOffs].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
};

// ─── Issue requests (§3) and the custody they create ──────────────────────

/** Step 1: the project manager names the recipient; fixed assets need an employee and a count frequency. */
export const createIssueRequest = async (actor: Actor, input: IssueRequestInput): Promise<IssueRequest> => {
  assertRole(actor.role, REQUESTERS, "raise issue requests");
  return transact((store) => {
    findOrThrow(store.Projects, input.projectUuid, "Project");
    findOrThrow(store.Warehouses, input.warehouseUuid, "Warehouse");
    const items = input.lines.map((l) => findOrThrow(store.Items, l.itemUuid, "Item"));
    const hasAssets = items.some((i) => i.kind === "fixed_asset");
    if (hasAssets && input.recipientKind !== "employee") {
      throw new Error("Fixed assets are issued as custody to an employee");
    }
    if (hasAssets && !input.inventoryFrequency) {
      throw new Error("Choose how often the custody is counted");
    }
    if (input.recipientKind === "subcontractor") {
      findOrThrow(store.Subcontractors, input.subcontractorUuid ?? "", "Subcontractor");
    }
    const request: IssueRequest = {
      uuid: generateUuid(),
      number: nextDocumentNumber("IR", store.IssueRequests.map((r) => r.number)),
      projectUuid: input.projectUuid,
      warehouseUuid: input.warehouseUuid,
      requestedBy: actor.name,
      recipient: {
        kind: input.recipientKind,
        name: input.recipientName,
        subcontractorUuid: input.recipientKind === "subcontractor" ? input.subcontractorUuid : undefined,
      },
      lines: input.lines,
      inventoryFrequency: hasAssets ? input.inventoryFrequency : undefined,
      status: "pending_approval",
      approvals: [],
    };
    store.IssueRequests.push(request);
    log(store, actor, "issue_request", request.uuid, request.number, "Issue request raised", input.recipientName);
    return request;
  });
};

export const getIssueRequest = async (uuid: string): Promise<IssueRequestDetail> => {
  const store = readStore();
  const request = findOrThrow(store.IssueRequests, uuid, "Issue request");
  const project = findOrThrow(store.Projects, request.projectUuid, "Project");
  return {
    request,
    project: { uuid: project.uuid, code: project.code, name: project.name },
    warehouse: findOrThrow(store.Warehouses, request.warehouseUuid, "Warehouse"),
    lines: request.lines.map(lineView(store, request.warehouseUuid)),
    chain: chainState(ISSUE_CHAIN, request.approvals),
  };
};

/** Step 2: the region project manager. */
export const decideIssueRequest = async (actor: Actor, uuid: string, input: DecisionFormInput): Promise<void> =>
  transact((store) => {
    const request = findOrThrow(store.IssueRequests, uuid, "Issue request");
    if (request.status !== "pending_approval") {
      throw new Error("This request is not waiting for approval");
    }
    request.approvals = decide(ISSUE_CHAIN, request.approvals, { actor, ...input });
    request.status = input.decision === "approved" ? "approved" : "rejected";
    log(store, actor, "issue_request", request.uuid, request.number, input.decision === "approved" ? "Approved" : "Rejected", input.note);
  });

/**
 * Steps 3–4: the issue note is signed and the stock deducted, charged to the
 * recipient. A fixed asset becomes custody on the employee until it is returned.
 */
export const issueStock = async (actor: Actor, uuid: string, input: IssueStockInput): Promise<void> => {
  assertRole(actor.role, WAREHOUSE_EDITORS, "issue stock");
  transact((store) => {
    const request = findOrThrow(store.IssueRequests, uuid, "Issue request");
    if (request.status !== "approved") {
      throw new Error("Stock is issued against an approved request");
    }
    assertStockCovers(store, request.warehouseUuid, request.lines);
    const now = nowIso();
    for (const line of request.lines) {
      const item = findOrThrow(store.Items, line.itemUuid, "Item");
      addMovement(store, {
        type: "issue",
        itemUuid: line.itemUuid,
        warehouseUuid: request.warehouseUuid,
        qty: -line.qty,
        unitCost: averageCost(store, line.itemUuid),
        refKind: "issue_request",
        refUuid: request.uuid,
        refNumber: request.number,
        projectUuid: request.projectUuid,
        chargedTo: request.recipient,
        at: now,
        by: actor.name,
      });
      if (item.kind === "fixed_asset") {
        store.AssetCustodies.push({
          uuid: generateUuid(),
          itemUuid: item.uuid,
          qty: line.qty,
          employeeName: request.recipient.name,
          issueRequestUuid: request.uuid,
          projectUuid: request.projectUuid,
          inventoryFrequency: request.inventoryFrequency ?? "monthly",
          issuedAt: now,
          status: "with_employee",
        });
      }
    }
    request.status = "issued";
    request.issuedAt = now;
    request.signedByRecipient = input.signedByRecipient;
    request.signedByKeeper = actor.name;
    log(store, actor, "issue_request", request.uuid, request.number, "Stock issued", `Signed by ${input.signedByRecipient}`);
  });
};

export const listAssetCustodies = async (): Promise<AssetCustodyRow[]> => {
  const store = readStore();
  const now = nowIso();
  return store.AssetCustodies.map((c) => {
    const item = findOrThrow(store.Items, c.itemUuid, "Item");
    const next = nextCountAt(c);
    return {
      ...c,
      item: { code: item.code, name: item.name },
      projectCode: findOrThrow(store.Projects, c.projectUuid, "Project").code,
      nextCountAt: next,
      countOverdue: c.status === "with_employee" && next < now,
    };
  });
};

/** The periodic custody count: what is with the employee matches the record. */
export const countAssetCustody = async (actor: Actor, uuid: string): Promise<void> => {
  assertRole(actor.role, [...WAREHOUSE_EDITORS, "region_project_manager"], "count custody");
  transact((store) => {
    const custody = findOrThrow(store.AssetCustodies, uuid, "Custody");
    if (custody.status !== "with_employee") {
      throw new Error("This custody is closed");
    }
    custody.lastCountedAt = nowIso();
    log(store, actor, "asset_custody", custody.uuid, custody.employeeName, "Custody counted");
  });
};

/** Returned to the warehouse it came from; lost or damaged closes it for a write-off decision. */
export const closeAssetCustody = async (actor: Actor, uuid: string, input: AssetReturnInput): Promise<void> => {
  assertRole(actor.role, WAREHOUSE_EDITORS, "close custody");
  transact((store) => {
    const custody = findOrThrow(store.AssetCustodies, uuid, "Custody");
    if (custody.status !== "with_employee") {
      throw new Error("This custody is already closed");
    }
    const now = nowIso();
    if (input.status === "returned") {
      const request = findOrThrow(store.IssueRequests, custody.issueRequestUuid, "Issue request");
      addMovement(store, {
        type: "return",
        itemUuid: custody.itemUuid,
        warehouseUuid: request.warehouseUuid,
        qty: custody.qty,
        unitCost: averageCost(store, custody.itemUuid),
        refKind: "asset_custody",
        refUuid: custody.uuid,
        refNumber: request.number,
        projectUuid: custody.projectUuid,
        at: now,
        by: actor.name,
      });
    }
    custody.status = input.status;
    custody.closedAt = now;
    log(store, actor, "asset_custody", custody.uuid, custody.employeeName, `Custody ${ASSET_CUSTODY_STATUS_LABELS[input.status].toLowerCase()}`);
  });
};

// ─── Transfers, stocktakes, write-offs (§5) ────────────────────────────────

export const createTransfer = async (actor: Actor, input: TransferInput): Promise<StockTransfer> => {
  assertRole(actor.role, [...WAREHOUSE_EDITORS, ...REQUESTERS], "request transfers");
  return transact((store) => {
    assertStockCovers(store, input.fromWarehouseUuid, input.lines);
    const transfer: StockTransfer = {
      uuid: generateUuid(),
      number: nextDocumentNumber("TR", store.StockTransfers.map((t) => t.number)),
      fromWarehouseUuid: input.fromWarehouseUuid,
      toWarehouseUuid: input.toWarehouseUuid,
      lines: input.lines,
      status: "pending_approval",
      approvals: [],
      requestedBy: actor.name,
      createdAt: nowIso(),
    };
    store.StockTransfers.push(transfer);
    log(store, actor, "stock_transfer", transfer.uuid, transfer.number, "Transfer requested");
    return transfer;
  });
};

export const getTransfer = async (uuid: string): Promise<TransferDetail> => {
  const store = readStore();
  const transfer = findOrThrow(store.StockTransfers, uuid, "Transfer");
  return {
    transfer,
    from: findOrThrow(store.Warehouses, transfer.fromWarehouseUuid, "Warehouse"),
    to: findOrThrow(store.Warehouses, transfer.toWarehouseUuid, "Warehouse"),
    lines: transfer.lines.map(lineView(store, transfer.fromWarehouseUuid)),
    chain: chainState(TRANSFER_CHAIN, transfer.approvals),
  };
};

/** On the last approval the balance moves between the warehouses automatically. */
export const decideTransfer = async (actor: Actor, uuid: string, input: DecisionFormInput): Promise<void> =>
  transact((store) => {
    const transfer = findOrThrow(store.StockTransfers, uuid, "Transfer");
    const outcome = decideWarehouseDoc(transfer, TRANSFER_CHAIN, actor, input);
    log(store, actor, "stock_transfer", transfer.uuid, transfer.number, input.decision === "approved" ? "Approved" : "Rejected", input.note);
    if (outcome === "rejected") {
      transfer.status = "rejected";
      return;
    }
    if (outcome === "pending") {
      return;
    }
    assertStockCovers(store, transfer.fromWarehouseUuid, transfer.lines);
    const now = nowIso();
    for (const line of transfer.lines) {
      const unitCost = averageCost(store, line.itemUuid);
      const common = { itemUuid: line.itemUuid, unitCost, refKind: "stock_transfer" as const, refUuid: transfer.uuid, refNumber: transfer.number, at: now, by: actor.name };
      addMovement(store, { ...common, type: "transfer_out", warehouseUuid: transfer.fromWarehouseUuid, qty: -line.qty });
      addMovement(store, { ...common, type: "transfer_in", warehouseUuid: transfer.toWarehouseUuid, qty: line.qty });
    }
    transfer.status = "completed";
    transfer.completedAt = now;
    log(store, actor, "stock_transfer", transfer.uuid, transfer.number, "Balance transferred");
  });

/** The count, with the book quantity frozen beside it at the moment it was taken. */
export const createStocktake = async (actor: Actor, input: StocktakeInput): Promise<Stocktake> => {
  assertRole(actor.role, WAREHOUSE_EDITORS, "record stocktakes");
  const countedAt = toIso(input.countedAt);
  assertNotFuture(countedAt);
  return transact((store) => {
    findOrThrow(store.Warehouses, input.warehouseUuid, "Warehouse");
    const stocktake: Stocktake = {
      uuid: generateUuid(),
      number: nextDocumentNumber("ST", store.Stocktakes.map((s) => s.number)),
      warehouseUuid: input.warehouseUuid,
      countedAt,
      countedBy: actor.name,
      lines: input.lines.map((l) => ({
        itemUuid: l.itemUuid,
        actualQty: l.actualQty,
        bookQty: stockBalance(store, l.itemUuid, input.warehouseUuid),
      })),
      status: "pending_approval",
      approvals: [],
    };
    store.Stocktakes.push(stocktake);
    log(store, actor, "stocktake", stocktake.uuid, stocktake.number, "Stocktake recorded");
    return stocktake;
  });
};

export const getStocktake = async (uuid: string): Promise<StocktakeDetail> => {
  const store = readStore();
  const stocktake = findOrThrow(store.Stocktakes, uuid, "Stocktake");
  return {
    stocktake,
    warehouse: findOrThrow(store.Warehouses, stocktake.warehouseUuid, "Warehouse"),
    lines: stocktake.lines.map((l) => {
      const item = findOrThrow(store.Items, l.itemUuid, "Item");
      return {
        ...l,
        item: { code: item.code, name: item.name, unit: item.unit, kind: item.kind },
        difference: round2(l.actualQty - l.bookQty),
      };
    }),
    chain: chainState(STOCKTAKE_CHAIN, stocktake.approvals),
  };
};

/** Management approval settles each difference with an adjustment movement. */
export const decideStocktake = async (actor: Actor, uuid: string, input: DecisionFormInput): Promise<void> =>
  transact((store) => {
    const stocktake = findOrThrow(store.Stocktakes, uuid, "Stocktake");
    const outcome = decideWarehouseDoc(stocktake, STOCKTAKE_CHAIN, actor, input);
    log(store, actor, "stocktake", stocktake.uuid, stocktake.number, input.decision === "approved" ? "Approved" : "Rejected", input.note);
    if (outcome === "rejected") {
      stocktake.status = "rejected";
      return;
    }
    if (outcome === "pending") {
      return;
    }
    for (const line of stocktake.lines.filter((l) => l.actualQty !== l.bookQty)) {
      addMovement(store, {
        type: "adjustment",
        itemUuid: line.itemUuid,
        warehouseUuid: stocktake.warehouseUuid,
        qty: line.actualQty - line.bookQty,
        unitCost: averageCost(store, line.itemUuid),
        refKind: "stocktake",
        refUuid: stocktake.uuid,
        refNumber: stocktake.number,
        at: nowIso(),
        by: actor.name,
      });
    }
    stocktake.status = "completed";
  });

export const createWriteOff = async (actor: Actor, input: WriteOffInput): Promise<WriteOff> => {
  assertRole(actor.role, WAREHOUSE_EDITORS, "raise write-offs");
  return transact((store) => {
    assertStockCovers(store, input.warehouseUuid, input.lines);
    const writeOff: WriteOff = {
      uuid: generateUuid(),
      number: nextDocumentNumber("WO", store.WriteOffs.map((w) => w.number)),
      warehouseUuid: input.warehouseUuid,
      lines: input.lines,
      reason: input.reason,
      investigation: input.investigation,
      decision: input.decision,
      chargedEmployee: input.decision === "charge_employee" ? input.chargedEmployee : undefined,
      status: "pending_approval",
      approvals: [],
      requestedBy: actor.name,
      createdAt: nowIso(),
    };
    store.WriteOffs.push(writeOff);
    log(store, actor, "write_off", writeOff.uuid, writeOff.number, "Write-off raised", `${WRITE_OFF_REASON_LABELS[input.reason]} — ${WRITE_OFF_DECISION_LABELS[input.decision]}`);
    return writeOff;
  });
};

export const getWriteOff = async (uuid: string): Promise<WriteOffDetail> => {
  const store = readStore();
  const writeOff = findOrThrow(store.WriteOffs, uuid, "Write-off");
  return {
    writeOff,
    warehouse: findOrThrow(store.Warehouses, writeOff.warehouseUuid, "Warehouse"),
    lines: writeOff.lines.map(lineView(store, writeOff.warehouseUuid)),
    value: round2(sumBy(writeOff.lines, (l) => l.qty * averageCost(store, l.itemUuid))),
    chain: chainState(WRITE_OFF_CHAIN, writeOff.approvals),
  };
};

export const decideWriteOff = async (actor: Actor, uuid: string, input: DecisionFormInput): Promise<void> =>
  transact((store) => {
    const writeOff = findOrThrow(store.WriteOffs, uuid, "Write-off");
    const outcome = decideWarehouseDoc(writeOff, WRITE_OFF_CHAIN, actor, input);
    log(store, actor, "write_off", writeOff.uuid, writeOff.number, input.decision === "approved" ? "Approved" : "Rejected", input.note);
    if (outcome === "rejected") {
      writeOff.status = "rejected";
      return;
    }
    if (outcome === "pending") {
      return;
    }
    assertStockCovers(store, writeOff.warehouseUuid, writeOff.lines);
    for (const line of writeOff.lines) {
      addMovement(store, {
        type: "write_off",
        itemUuid: line.itemUuid,
        warehouseUuid: writeOff.warehouseUuid,
        qty: -line.qty,
        unitCost: averageCost(store, line.itemUuid),
        refKind: "write_off",
        refUuid: writeOff.uuid,
        refNumber: writeOff.number,
        chargedTo: writeOff.chargedEmployee ? { kind: "employee", name: writeOff.chargedEmployee } : undefined,
        at: nowIso(),
        by: actor.name,
      });
    }
    writeOff.status = "completed";
  });
