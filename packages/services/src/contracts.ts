import { formatMoney, generateUuid, nextDocumentNumber, nowIso, round2, sumBy, toIso } from "utils";
import { OrderUnderContractInput, SupplierContractInput } from "validators";
import { readStore, transact } from "../../../db";
import { Item, PurchaseOrder, Store, Supplier, SupplierContract } from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { assertRole, findOrThrow } from "./core/lookup";
import { PROCUREMENT_EDITORS } from "./core/roles";
import { withVat } from "./core/tax";
import { contractCoverageBlocker, linesTotal } from "./rules/procurement";

// ANNUAL CONTRACTS (procurement §1, other cases): "repeat POs on an annual
// contract at an agreed price". A request whose items a contract in force
// prices can skip the RFQ and the quotation chain — the PO is raised at the
// contract's prices and goes straight to the PO approval chain, carrying the
// contract's delivery, payment and late-penalty terms.

export type SupplierContractRow = SupplierContract & {
  supplierName: Supplier["name"];
  active: boolean;
  callOffCount: number;
  orderedValue: number;
};

export type SupplierContractDetail = {
  contract: SupplierContractRow;
  supplier: Supplier;
  lines: (SupplierContract["lines"][number] & { item: Pick<Item, "code" | "name" | "unit"> })[];
  callOffs: Pick<PurchaseOrder, "uuid" | "number" | "status" | "total" | "createdAt">[];
};

/** A contract that can supply a request today, for the RFQ step. */
export type CoveringContract = Pick<SupplierContract, "uuid" | "number" | "title"> & {
  supplierName: Supplier["name"];
  subtotal: number;
};

const toRow = (store: Store, contract: SupplierContract, now: string): SupplierContractRow => {
  const callOffs = store.PurchaseOrders.filter(
    (po) => po.contractUuid === contract.uuid && po.status !== "cancelled" && po.status !== "rejected",
  );
  return {
    ...contract,
    supplierName: findOrThrow(store.Suppliers, contract.supplierUuid, "Supplier").name,
    active: now >= contract.startsAt && now <= contract.endsAt,
    callOffCount: callOffs.length,
    orderedValue: round2(sumBy(callOffs, (po) => po.subtotal)),
  };
};

/** The contracts in force today that price every item on `lines`, with what the request would cost under each. */
export const coveringContracts = (
  store: Store,
  lines: { itemUuid: string; qty: number }[],
  now: string,
): CoveringContract[] =>
  store.SupplierContracts.filter((c) => contractCoverageBlocker(c, lines, now) === null).map((c) => ({
    uuid: c.uuid,
    number: c.number,
    title: c.title,
    supplierName: findOrThrow(store.Suppliers, c.supplierUuid, "Supplier").name,
    subtotal: linesTotal(
      lines.map((l) => ({ ...l, unitPrice: c.lines.find((p) => p.itemUuid === l.itemUuid)?.unitPrice ?? 0 })),
    ),
  }));

export const listSupplierContracts = async (): Promise<SupplierContractRow[]> => {
  const store = readStore();
  const now = nowIso();
  return [...store.SupplierContracts].reverse().map((c) => toRow(store, c, now));
};

export const getSupplierContract = async (uuid: string): Promise<SupplierContractDetail> => {
  const store = readStore();
  const contract = findOrThrow(store.SupplierContracts, uuid, "Contract");
  return {
    contract: toRow(store, contract, nowIso()),
    supplier: findOrThrow(store.Suppliers, contract.supplierUuid, "Supplier"),
    lines: contract.lines.map((line) => {
      const item = findOrThrow(store.Items, line.itemUuid, "Item");
      return { ...line, item: { code: item.code, name: item.name, unit: item.unit } };
    }),
    callOffs: store.PurchaseOrders.filter((po) => po.contractUuid === uuid).map((po) => ({
      uuid: po.uuid,
      number: po.number,
      status: po.status,
      total: po.total,
      createdAt: po.createdAt,
    })),
  };
};

export const createSupplierContract = async (actor: Actor, input: SupplierContractInput): Promise<SupplierContract> => {
  assertRole(actor.role, PROCUREMENT_EDITORS, "sign annual contracts");
  return transact((store) => {
    const supplier = findOrThrow(store.Suppliers, input.supplierUuid, "Supplier");
    const items = new Set(input.lines.map((l) => l.itemUuid));
    if (items.size !== input.lines.length) {
      throw new Error("Each item is priced once in a contract");
    }
    for (const line of input.lines) {
      findOrThrow(store.Items, line.itemUuid, "Item");
    }
    const contract: SupplierContract = {
      uuid: generateUuid(),
      number: nextDocumentNumber("AC", store.SupplierContracts.map((c) => c.number)),
      supplierUuid: supplier.uuid,
      title: input.title,
      startsAt: toIso(input.startsAt),
      // In force through the whole of its last day.
      endsAt: `${input.endsAt}T23:59:59.999Z`,
      lines: input.lines.map((l) => ({ itemUuid: l.itemUuid, unitPrice: round2(l.unitPrice) })),
      deliveryDays: input.deliveryDays,
      paymentTermsDays: input.paymentTermsDays,
      latePenaltyPctPerDay: input.latePenaltyPctPerDay,
      latePenaltyCapPct: input.latePenaltyCapPct,
      createdBy: actor.name,
      createdAt: nowIso(),
    };
    store.SupplierContracts.push(contract);
    logActivity(store, {
      actorName: actor.name,
      entity: "supplier_contract",
      entityUuid: contract.uuid,
      entityLabel: contract.number,
      action: "Annual contract signed",
      detail: `${supplier.name} — ${contract.lines.length} item(s)`,
    });
    return contract;
  });
};

/**
 * A request in RFQ ordered under a contract: the PO is raised at the contract's
 * prices and terms and waits for the PO approval chain (step 8), as any PO does.
 */
export const orderUnderContract = async (
  actor: Actor,
  prUuid: string,
  input: OrderUnderContractInput,
): Promise<PurchaseOrder> => {
  assertRole(actor.role, PROCUREMENT_EDITORS, "order under contracts");
  return transact((store) => {
    const pr = findOrThrow(store.PurchaseRequests, prUuid, "Purchase request");
    if (pr.status !== "rfq") {
      throw new Error("A request is ordered under a contract at the quotation step");
    }
    const contract = findOrThrow(store.SupplierContracts, input.contractUuid, "Contract");
    const now = nowIso();
    const blocker = contractCoverageBlocker(contract, pr.lines, now);
    if (blocker) {
      throw new Error(blocker);
    }
    const lines = pr.lines.map((l) => ({
      itemUuid: l.itemUuid,
      qty: l.qty,
      unitPrice: contract.lines.find((c) => c.itemUuid === l.itemUuid)?.unitPrice ?? 0,
    }));
    const subtotal = linesTotal(lines);
    const po: PurchaseOrder = {
      uuid: generateUuid(),
      number: nextDocumentNumber("PO", store.PurchaseOrders.map((p) => p.number)),
      prUuid: pr.uuid,
      contractUuid: contract.uuid,
      supplierUuid: contract.supplierUuid,
      projectUuid: pr.projectUuid,
      budgetCategory: pr.budgetCategory,
      lines,
      subtotal,
      ...withVat(subtotal),
      deliveryDays: contract.deliveryDays,
      paymentTermsDays: contract.paymentTermsDays,
      latePenaltyPctPerDay: contract.latePenaltyPctPerDay,
      latePenaltyCapPct: contract.latePenaltyCapPct,
      status: "pending_approval",
      approvals: [],
      advancePaid: 0,
      amendments: [],
      createdAt: now,
    };
    store.PurchaseOrders.push(po);
    pr.status = "ordered";
    logActivity(store, {
      actorName: actor.name,
      entity: "purchase_request",
      entityUuid: pr.uuid,
      entityLabel: pr.number,
      action: "Ordered under annual contract",
      detail: `${contract.number} → ${po.number}`,
    });
    logActivity(store, {
      actorName: actor.name,
      entity: "purchase_order",
      entityUuid: po.uuid,
      entityLabel: po.number,
      action: "Purchase order raised",
      detail: `Call-off under ${contract.number} — ${formatMoney(po.total)}`,
    });
    return po;
  });
};
