import { addDays, formatMoney, generateUuid, nextDocumentNumber, nowIso, round2, sumBy, toIso } from "utils";
import {
  AdvancePaymentInput,
  AmendPurchaseOrderInput,
  CancelPurchaseOrderInput,
  DecisionFormInput,
  GoodsReceiptInput,
  PenaltyTermsInput,
  ProcurementReviewInput,
  PurchaseRequestInput,
  QuotationInput,
  SelectQuotationInput,
  SupplierEvaluationInput,
} from "validators";
import { readStore, transact } from "../../../db";
import { BUDGET_CATEGORY_LABELS } from "../../../db/label";
import {
  GoodsReceipt,
  Item,
  Project,
  PurchaseOrder,
  PurchaseRequest,
  Quotation,
  Store,
  Supplier,
  SupplierContract,
} from "../../../db/types";
import { Actor } from "./core/actor";
import { logActivity } from "./core/activity";
import { ChainState, chainState, decide } from "./core/approvals";
import { COMPANY_PROFILE } from "./core/company";
import { assertNotFuture, assertRole, findOrThrow } from "./core/lookup";
import { FINANCE_EDITORS, PROCUREMENT_EDITORS, REQUESTERS, WAREHOUSE_EDITORS } from "./core/roles";
import { addMovement, stockBalance } from "./core/stock";
import { withVat } from "./core/tax";
import { budgetBlocker, budgetUsage } from "./budgets";
import { CoveringContract, coveringContracts } from "./contracts";
import { SupplierReturnRow, listPurchaseOrderReturns, recordRejectedAtReceipt, settleRedelivered } from "./returns";
import { PR_CHAIN, PURCHASE_CHAIN, STOCK_SUPPLY_CHAIN } from "./rules/chains";
import {
  QuotationComparison,
  ReceiptLineState,
  amendmentBlocker,
  compareQuotations,
  goodsReceiptBlocker,
  linesTotal,
  receiptState,
  rfqBlocker,
} from "./rules/procurement";

// THE PURCHASING CYCLE (procurement §1) and RECEIVING (§2).
//
//   PR ─ direct manager ─ procurement review ─┬─ stock available → stock chain → issue request
//                                             └─ RFQ (3 suppliers) → quotation chain → PO
//   PO ─ PO chain ─ sent by e-mail ─ goods receipts ─ supplier evaluation

export type PurchaseRequestRow = Pick<
  PurchaseRequest,
  "uuid" | "number" | "status" | "department" | "requestedBy" | "createdAt" | "budgetCategory"
> & {
  projectCode: Project["code"];
  estimate: number;
  itemCount: number;
  awaiting: ChainState["nextRole"];
};

export type ItemLine<L> = L & {
  item: Pick<Item, "uuid" | "code" | "name" | "unit" | "kind">;
};

export type QuotationView = Quotation & {
  supplierName: Supplier["name"];
  total: number;
};

export type PurchaseRequestDetail = {
  pr: PurchaseRequest;
  project: Pick<Project, "uuid" | "code" | "name">;
  lines: ItemLine<PurchaseRequest["lines"][number] & { inStock: number }>[];
  estimate: number;
  budgetRemaining: number;
  prChain: ChainState;
  stockChain: ChainState;
  quoteChain: ChainState;
  quotations: QuotationView[];
  comparison: (QuotationComparison & { supplierName: string })[];
  rfqBlocker: string | null;
  /** Total in all warehouses covers every line — procurement's system check. */
  systemStockCovers: boolean;
  purchaseOrder: (Pick<PurchaseOrder, "uuid" | "number" | "status"> & { contractNumber?: SupplierContract["number"] }) | null;
  /** Annual contracts in force that price every item — the request can skip the RFQ. */
  contracts: CoveringContract[];
};

export type PurchaseOrderRow = Pick<
  PurchaseOrder,
  "uuid" | "number" | "status" | "total" | "createdAt" | "expectedDeliveryAt"
> & {
  supplierName: Supplier["name"];
  projectCode: Project["code"];
  late: boolean;
  awaiting: ChainState["nextRole"];
};

export type PurchaseOrderDetail = {
  po: PurchaseOrder;
  pr: Pick<PurchaseRequest, "uuid" | "number">;
  quotation: Pick<Quotation, "uuid" | "number"> | null;
  contract: Pick<SupplierContract, "uuid" | "number" | "title"> | null;
  supplier: Supplier;
  project: Pick<Project, "uuid" | "code" | "name">;
  company: typeof COMPANY_PROFILE;
  lines: ItemLine<PurchaseOrder["lines"][number] & { lineTotal: number }>[];
  chain: ChainState;
  receipts: GoodsReceipt[];
  receiptState: ItemLine<ReceiptLineState>[];
  late: boolean;
  advanceRecovered: number;
  returns: SupplierReturnRow[];
};

const itemRef = (store: Store, itemUuid: string): ItemLine<object>["item"] => {
  const item = findOrThrow(store.Items, itemUuid, "Item");
  return { uuid: item.uuid, code: item.code, name: item.name, unit: item.unit, kind: item.kind };
};

const estimateOf = (pr: PurchaseRequest): number =>
  round2(sumBy(pr.lines, (l) => l.qty * l.estUnitPrice));

const logPr = (store: Store, actor: Actor, pr: PurchaseRequest, action: string, detail?: string) =>
  logActivity(store, {
    actorName: actor.name,
    entity: "purchase_request",
    entityUuid: pr.uuid,
    entityLabel: pr.number,
    action,
    detail,
  });

const logPo = (store: Store, actor: Actor, po: PurchaseOrder, action: string, detail?: string) =>
  logActivity(store, {
    actorName: actor.name,
    entity: "purchase_order",
    entityUuid: po.uuid,
    entityLabel: po.number,
    action,
    detail,
  });

const isLate = (po: PurchaseOrder, now: string): boolean =>
  Boolean(po.expectedDeliveryAt) &&
  (po.status === "sent" || po.status === "partially_received") &&
  (po.expectedDeliveryAt ?? "") < now;

const prNextRole = (pr: PurchaseRequest): ChainState["nextRole"] => {
  if (pr.status === "pending_manager") {
    return chainState(PR_CHAIN, pr.approvals).nextRole;
  }
  if (pr.status === "in_review" || pr.status === "rfq") {
    return "procurement";
  }
  if (pr.status === "stock_approval") {
    return chainState(STOCK_SUPPLY_CHAIN, pr.approvals.slice(PR_CHAIN.length)).nextRole;
  }
  if (pr.status === "quote_approval") {
    return chainState(PURCHASE_CHAIN, pr.quoteApprovals).nextRole;
  }
  return null;
};

// ─── Reads ─────────────────────────────────────────────────────────────────

export const listPurchaseRequests = async (): Promise<PurchaseRequestRow[]> => {
  const store = readStore();
  return [...store.PurchaseRequests].reverse().map((pr) => ({
    uuid: pr.uuid,
    number: pr.number,
    status: pr.status,
    department: pr.department,
    requestedBy: pr.requestedBy,
    createdAt: pr.createdAt,
    budgetCategory: pr.budgetCategory,
    projectCode: findOrThrow(store.Projects, pr.projectUuid, "Project").code,
    estimate: estimateOf(pr),
    itemCount: pr.lines.length,
    awaiting: prNextRole(pr),
  }));
};

export const getPurchaseRequest = async (uuid: string): Promise<PurchaseRequestDetail> => {
  const store = readStore();
  const pr = findOrThrow(store.PurchaseRequests, uuid, "Purchase request");
  const project = findOrThrow(store.Projects, pr.projectUuid, "Project");
  const quotations = store.Quotations.filter((q) => q.prUuid === pr.uuid);
  const supplierName = (supplierUuid: string) =>
    findOrThrow(store.Suppliers, supplierUuid, "Supplier").name;
  const po = store.PurchaseOrders.find((p) => p.prUuid === pr.uuid);
  return {
    pr,
    project: { uuid: project.uuid, code: project.code, name: project.name },
    lines: pr.lines.map((line) => ({
      ...line,
      item: itemRef(store, line.itemUuid),
      inStock: stockBalance(store, line.itemUuid),
    })),
    estimate: estimateOf(pr),
    budgetRemaining:
      budgetUsage(store, pr.projectUuid).find((l) => l.category === pr.budgetCategory)?.remaining ?? 0,
    prChain: chainState(PR_CHAIN, pr.approvals.slice(0, PR_CHAIN.length)),
    stockChain: chainState(STOCK_SUPPLY_CHAIN, pr.approvals.slice(PR_CHAIN.length)),
    quoteChain: chainState(PURCHASE_CHAIN, pr.quoteApprovals),
    quotations: quotations.map((q) => ({ ...q, supplierName: supplierName(q.supplierUuid), total: linesTotal(q.lines) })),
    comparison: compareQuotations(quotations).map((c) => ({ ...c, supplierName: supplierName(c.supplierUuid) })),
    rfqBlocker: rfqBlocker(quotations),
    systemStockCovers: pr.lines.every((l) => stockBalance(store, l.itemUuid) >= l.qty),
    purchaseOrder: po
      ? {
          uuid: po.uuid,
          number: po.number,
          status: po.status,
          contractNumber: store.SupplierContracts.find((c) => c.uuid === po.contractUuid)?.number,
        }
      : null,
    contracts: pr.status === "rfq" ? coveringContracts(store, pr.lines, nowIso()) : [],
  };
};

export const listPurchaseOrders = async (): Promise<PurchaseOrderRow[]> => {
  const store = readStore();
  const now = nowIso();
  return [...store.PurchaseOrders].reverse().map((po) => ({
    uuid: po.uuid,
    number: po.number,
    status: po.status,
    total: po.total,
    createdAt: po.createdAt,
    expectedDeliveryAt: po.expectedDeliveryAt,
    supplierName: findOrThrow(store.Suppliers, po.supplierUuid, "Supplier").name,
    projectCode: findOrThrow(store.Projects, po.projectUuid, "Project").code,
    late: isLate(po, now),
    awaiting: po.status === "pending_approval" ? chainState(PURCHASE_CHAIN, po.approvals).nextRole : null,
  }));
};

export const getPurchaseOrder = async (uuid: string): Promise<PurchaseOrderDetail> => {
  const store = readStore();
  const po = findOrThrow(store.PurchaseOrders, uuid, "Purchase order");
  const pr = findOrThrow(store.PurchaseRequests, po.prUuid, "Purchase request");
  const quotation = po.quotationUuid ? findOrThrow(store.Quotations, po.quotationUuid, "Quotation") : null;
  const contract = po.contractUuid ? findOrThrow(store.SupplierContracts, po.contractUuid, "Contract") : null;
  const project = findOrThrow(store.Projects, po.projectUuid, "Project");
  const receipts = store.GoodsReceipts.filter((r) => r.poUuid === po.uuid);
  return {
    po,
    pr: { uuid: pr.uuid, number: pr.number },
    quotation: quotation ? { uuid: quotation.uuid, number: quotation.number } : null,
    contract: contract ? { uuid: contract.uuid, number: contract.number, title: contract.title } : null,
    supplier: findOrThrow(store.Suppliers, po.supplierUuid, "Supplier"),
    project: { uuid: project.uuid, code: project.code, name: project.name },
    company: COMPANY_PROFILE,
    lines: po.lines.map((line) => ({
      ...line,
      lineTotal: round2(line.qty * line.unitPrice),
      item: itemRef(store, line.itemUuid),
    })),
    chain: chainState(PURCHASE_CHAIN, po.approvals),
    receipts,
    receiptState: receiptState(po, receipts).map((s) => ({ ...s, item: itemRef(store, s.itemUuid) })),
    late: isLate(po, nowIso()),
    advanceRecovered: round2(
      sumBy(
        store.SupplierInvoices.filter((inv) => inv.poUuid === po.uuid && inv.status !== "rejected"),
        (inv) => inv.advanceDeducted,
      ),
    ),
    returns: listPurchaseOrderReturns(store, po.uuid),
  };
};

// ─── Purchase requests ─────────────────────────────────────────────────────

/** Step 1. The budget must be approved; the amount is checked when the manager approves. */
export const createPurchaseRequest = async (
  actor: Actor,
  input: PurchaseRequestInput,
): Promise<PurchaseRequest> => {
  assertRole(actor.role, REQUESTERS, "raise purchase requests");
  return transact((store) => {
    findOrThrow(store.Projects, input.projectUuid, "Project");
    const budget = store.ProjectBudgets.find((b) => b.projectUuid === input.projectUuid);
    if (!budget || budget.status !== "approved") {
      throw new Error("The project's budget must be approved before purchases are requested");
    }
    for (const line of input.lines) {
      findOrThrow(store.Items, line.itemUuid, "Item");
    }
    const pr: PurchaseRequest = {
      uuid: generateUuid(),
      number: nextDocumentNumber("PR", store.PurchaseRequests.map((p) => p.number)),
      projectUuid: input.projectUuid,
      department: input.department,
      budgetCategory: input.budgetCategory,
      requestedBy: actor.name,
      lines: input.lines.map((l) => ({ ...l, expectedDate: toIso(l.expectedDate) })),
      status: "pending_manager",
      approvals: [],
      quoteApprovals: [],
      note: input.note?.trim() || undefined,
      createdAt: nowIso(),
    };
    store.PurchaseRequests.push(pr);
    logPr(store, actor, pr, "Purchase request raised", formatMoney(estimateOf(pr)));
    return pr;
  });
};

/** Step 2, with the budget check of step 1: the estimate must fit what is left. */
export const decidePurchaseRequest = async (
  actor: Actor,
  uuid: string,
  input: DecisionFormInput,
): Promise<void> =>
  transact((store) => {
    const pr = findOrThrow(store.PurchaseRequests, uuid, "Purchase request");
    if (pr.status !== "pending_manager") {
      throw new Error("This request is not waiting for the direct manager");
    }
    if (input.decision === "approved") {
      const blocker = budgetBlocker(store, pr.projectUuid, pr.budgetCategory, estimateOf(pr));
      if (blocker) {
        throw new Error(blocker);
      }
    }
    pr.approvals = decide(PR_CHAIN, pr.approvals, { actor, ...input });
    pr.status = input.decision === "approved" ? "in_review" : "rejected";
    logPr(
      store,
      actor,
      pr,
      input.decision === "approved" ? "Approved by direct manager" : "Rejected by direct manager",
      input.decision === "approved"
        ? `${formatMoney(estimateOf(pr))} reserved against ${BUDGET_CATEGORY_LABELS[pr.budgetCategory]}`
        : input.note,
    );
  });

/**
 * Step 3. Procurement confirms what it found in the warehouse. Saying the stock
 * is there when the system shows it is not is refused — the two must agree.
 */
export const reviewPurchaseRequest = async (
  actor: Actor,
  uuid: string,
  input: ProcurementReviewInput,
): Promise<void> => {
  assertRole(actor.role, PROCUREMENT_EDITORS, "review purchase requests");
  transact((store) => {
    const pr = findOrThrow(store.PurchaseRequests, uuid, "Purchase request");
    if (pr.status !== "in_review") {
      throw new Error("This request is not in procurement review");
    }
    const covers = pr.lines.every((l) => stockBalance(store, l.itemUuid) >= l.qty);
    if (input.stockAvailable && !covers) {
      throw new Error("The system balance does not cover this request — it must be purchased");
    }
    pr.stockAvailable = input.stockAvailable;
    pr.status = input.stockAvailable ? "stock_approval" : "rfq";
    logPr(
      store,
      actor,
      pr,
      input.stockAvailable ? "Stock available — sent for stock supply approval" : "Not in stock — quotations requested",
    );
  });
};

/**
 * Step 3, stock route. On the last approval an approved issue request is raised
 * from the warehouse that holds the most, so the storekeeper can issue it.
 */
export const decideStockSupply = async (
  actor: Actor,
  uuid: string,
  input: DecisionFormInput,
): Promise<void> =>
  transact((store) => {
    const pr = findOrThrow(store.PurchaseRequests, uuid, "Purchase request");
    if (pr.status !== "stock_approval") {
      throw new Error("This request is not waiting for stock supply approval");
    }
    const stockApprovals = decide(STOCK_SUPPLY_CHAIN, pr.approvals.slice(PR_CHAIN.length), { actor, ...input });
    pr.approvals = [...pr.approvals.slice(0, PR_CHAIN.length), ...stockApprovals];
    const state = chainState(STOCK_SUPPLY_CHAIN, stockApprovals);
    if (state.rejected) {
      pr.status = "rejected";
      logPr(store, actor, pr, "Stock supply rejected", input.note);
      return;
    }
    logPr(store, actor, pr, "Stock supply approved");
    if (!state.complete) {
      return;
    }
    const warehouse = [...store.Warehouses].sort(
      (a, b) =>
        sumBy(pr.lines, (l) => stockBalance(store, l.itemUuid, b.uuid)) -
        sumBy(pr.lines, (l) => stockBalance(store, l.itemUuid, a.uuid)),
    )[0];
    const project = findOrThrow(store.Projects, pr.projectUuid, "Project");
    const number = nextDocumentNumber("IR", store.IssueRequests.map((r) => r.number));
    store.IssueRequests.push({
      uuid: generateUuid(),
      number,
      projectUuid: pr.projectUuid,
      warehouseUuid: warehouse.uuid,
      requestedBy: pr.requestedBy,
      recipient: { kind: "employee", name: project.projectManagerName },
      lines: pr.lines.map((l) => ({ itemUuid: l.itemUuid, qty: l.qty })),
      inventoryFrequency: "monthly",
      status: "approved",
      approvals: stockApprovals,
    });
    pr.status = "fulfilled_from_stock";
    logPr(store, actor, pr, "Supplied from stock", `${number} raised at ${warehouse.code}`);
  });

// ─── Quotations ────────────────────────────────────────────────────────────

/** Step 4. One quotation per supplier per request; requested by e-mail. */
export const addQuotation = async (actor: Actor, prUuid: string, input: QuotationInput): Promise<void> => {
  assertRole(actor.role, PROCUREMENT_EDITORS, "record quotations");
  transact((store) => {
    const pr = findOrThrow(store.PurchaseRequests, prUuid, "Purchase request");
    if (pr.status !== "rfq") {
      throw new Error("Quotations are collected while the request is in RFQ");
    }
    findOrThrow(store.Suppliers, input.supplierUuid, "Supplier");
    if (store.Quotations.some((q) => q.prUuid === prUuid && q.supplierUuid === input.supplierUuid)) {
      throw new Error("This supplier already has a quotation on the request");
    }
    const unknown = input.lines.find((l) => !pr.lines.some((p) => p.itemUuid === l.itemUuid));
    if (unknown) {
      throw new Error("A quotation can only price the items on the request");
    }
    const now = nowIso();
    const quotation: Quotation = {
      uuid: generateUuid(),
      number: nextDocumentNumber("RFQ", store.Quotations.map((q) => q.number)),
      prUuid,
      supplierUuid: input.supplierUuid,
      lines: input.lines,
      deliveryDays: input.deliveryDays,
      paymentTermsDays: input.paymentTermsDays,
      qualityScore: input.qualityScore,
      previouslyApproved: input.previouslyApproved,
      requestedByEmailAt: now,
      receivedAt: now,
    };
    store.Quotations.push(quotation);
    logPr(store, actor, pr, "Quotation recorded", `${quotation.number} — ${formatMoney(linesTotal(quotation.lines))}`);
  });
};

/** Step 5 → 6: the comparison is done; the chosen offer goes to the six approvers. */
export const submitQuotationForApproval = async (
  actor: Actor,
  prUuid: string,
  input: SelectQuotationInput,
): Promise<void> => {
  assertRole(actor.role, PROCUREMENT_EDITORS, "submit quotations");
  transact((store) => {
    const pr = findOrThrow(store.PurchaseRequests, prUuid, "Purchase request");
    if (pr.status !== "rfq") {
      throw new Error("The request is not collecting quotations");
    }
    const quotations = store.Quotations.filter((q) => q.prUuid === prUuid);
    const blocker = rfqBlocker(quotations);
    if (blocker) {
      throw new Error(blocker);
    }
    const chosen = findOrThrow(quotations, input.quotationUuid, "Quotation");
    pr.selectedQuotationUuid = chosen.uuid;
    pr.quoteApprovals = [];
    pr.status = "quote_approval";
    logPr(store, actor, pr, "Quotation submitted for approval", chosen.number);
  });
};

/**
 * Step 6. A rejection sends the request back to RFQ; the last approval raises
 * the PO (step 7) for the approvers of step 8.
 */
export const decideQuotation = async (actor: Actor, prUuid: string, input: DecisionFormInput): Promise<void> =>
  transact((store) => {
    const pr = findOrThrow(store.PurchaseRequests, prUuid, "Purchase request");
    if (pr.status !== "quote_approval" || !pr.selectedQuotationUuid) {
      throw new Error("No quotation is waiting for approval");
    }
    const approvals = decide(PURCHASE_CHAIN, pr.quoteApprovals, { actor, ...input });
    const state = chainState(PURCHASE_CHAIN, approvals);
    if (state.rejected) {
      pr.status = "rfq";
      pr.quoteApprovals = [];
      pr.selectedQuotationUuid = undefined;
      logPr(store, actor, pr, "Quotation rejected — back to RFQ", input.note);
      return;
    }
    pr.quoteApprovals = approvals;
    logPr(store, actor, pr, "Quotation approved");
    if (!state.complete) {
      return;
    }
    const quotation = findOrThrow(store.Quotations, pr.selectedQuotationUuid, "Quotation");
    const subtotal = linesTotal(quotation.lines);
    const po: PurchaseOrder = {
      uuid: generateUuid(),
      number: nextDocumentNumber("PO", store.PurchaseOrders.map((p) => p.number)),
      prUuid: pr.uuid,
      quotationUuid: quotation.uuid,
      supplierUuid: quotation.supplierUuid,
      projectUuid: pr.projectUuid,
      budgetCategory: pr.budgetCategory,
      lines: quotation.lines,
      subtotal,
      ...withVat(subtotal),
      deliveryDays: quotation.deliveryDays,
      paymentTermsDays: quotation.paymentTermsDays,
      status: "pending_approval",
      approvals: [],
      advancePaid: 0,
      amendments: [],
      createdAt: nowIso(),
    };
    store.PurchaseOrders.push(po);
    pr.status = "ordered";
    logPr(store, actor, pr, "Purchase order raised", po.number);
    logPo(store, actor, po, "Purchase order raised", `From ${quotation.number} — ${formatMoney(po.total)}`);
  });

// ─── Purchase orders ───────────────────────────────────────────────────────

export const decidePurchaseOrder = async (actor: Actor, uuid: string, input: DecisionFormInput): Promise<void> =>
  transact((store) => {
    const po = findOrThrow(store.PurchaseOrders, uuid, "Purchase order");
    if (po.status !== "pending_approval") {
      throw new Error("This PO is not waiting for approval");
    }
    po.approvals = decide(PURCHASE_CHAIN, po.approvals, { actor, ...input });
    const state = chainState(PURCHASE_CHAIN, po.approvals);
    if (state.rejected) {
      po.status = "rejected";
    } else if (state.complete) {
      po.status = "approved";
    }
    logPo(store, actor, po, input.decision === "approved" ? "Approved" : "Rejected", input.note);
  });

/** Step 7: sent by e-mail. The delivery date to follow up (step 9) starts here. */
export const sendPurchaseOrder = async (actor: Actor, uuid: string): Promise<void> => {
  assertRole(actor.role, PROCUREMENT_EDITORS, "send purchase orders");
  transact((store) => {
    const po = findOrThrow(store.PurchaseOrders, uuid, "Purchase order");
    if (po.status !== "approved") {
      throw new Error("Only a fully approved PO is sent to the supplier");
    }
    const supplier = findOrThrow(store.Suppliers, po.supplierUuid, "Supplier");
    const now = nowIso();
    po.status = "sent";
    po.sentAt = now;
    po.expectedDeliveryAt = addDays(now, po.deliveryDays);
    logPo(store, actor, po, "Sent to supplier by e-mail", supplier.email);
  });
};

/** Other cases: cancel, with the reason kept in the PO's change log. */
export const cancelPurchaseOrder = async (
  actor: Actor,
  uuid: string,
  input: CancelPurchaseOrderInput,
): Promise<void> => {
  assertRole(actor.role, PROCUREMENT_EDITORS, "cancel purchase orders");
  transact((store) => {
    const po = findOrThrow(store.PurchaseOrders, uuid, "Purchase order");
    if (store.GoodsReceipts.some((r) => r.poUuid === uuid)) {
      throw new Error("Goods were received against this PO — it can no longer be cancelled");
    }
    if (po.status === "cancelled" || po.status === "rejected") {
      throw new Error("The PO is already closed");
    }
    po.status = "cancelled";
    po.amendments.push({ at: nowIso(), by: actor.name, note: `Cancelled: ${input.note}` });
    logPo(store, actor, po, "Cancelled", input.note);
  });
};

/**
 * Other cases — modifying a PO "with the approval of procurement and whoever
 * approved it": procurement changes the lines or the delivery, any increase is
 * checked against the budget, and the PO goes back through its approval chain.
 * Every change is kept in the PO's change log.
 */
export const amendPurchaseOrder = async (actor: Actor, uuid: string, input: AmendPurchaseOrderInput): Promise<void> => {
  assertRole(actor.role, PROCUREMENT_EDITORS, "modify purchase orders");
  transact((store) => {
    const po = findOrThrow(store.PurchaseOrders, uuid, "Purchase order");
    const lines = input.lines.map((l) => ({ itemUuid: l.itemUuid, qty: round2(l.qty), unitPrice: round2(l.unitPrice) }));
    const blocker = amendmentBlocker(po, store.GoodsReceipts.filter((r) => r.poUuid === uuid), lines, input.deliveryDays);
    if (blocker) {
      throw new Error(blocker);
    }
    if (lines.some((l) => !po.lines.some((p) => p.itemUuid === l.itemUuid))) {
      throw new Error("A modification changes the PO's own lines; new items need a new request");
    }
    const subtotal = linesTotal(lines);
    const increase = round2(subtotal - po.subtotal);
    if (increase > 0) {
      const overBudget = budgetBlocker(store, po.projectUuid, po.budgetCategory, increase);
      if (overBudget) {
        throw new Error(overBudget);
      }
    }
    const before = formatMoney(po.total);
    po.lines = lines;
    po.subtotal = subtotal;
    Object.assign(po, withVat(subtotal));
    po.deliveryDays = input.deliveryDays;
    po.approvals = [];
    po.status = "pending_approval";
    po.amendments.push({ at: nowIso(), by: actor.name, note: `Modified (${before} → ${formatMoney(po.total)}): ${input.note}` });
    logPo(store, actor, po, "Modified — back to the approval chain", `${before} → ${formatMoney(po.total)} — ${input.note}`);
  });
};

/** The late-delivery penalty terms of a PO not under a contract, set before it is sent. */
export const setPenaltyTerms = async (actor: Actor, uuid: string, input: PenaltyTermsInput): Promise<void> => {
  assertRole(actor.role, PROCUREMENT_EDITORS, "set penalty terms");
  transact((store) => {
    const po = findOrThrow(store.PurchaseOrders, uuid, "Purchase order");
    if (po.contractUuid) {
      throw new Error("A call-off carries its contract's penalty terms");
    }
    if (po.status !== "pending_approval" && po.status !== "approved") {
      throw new Error("Penalty terms are set before the PO is sent");
    }
    po.latePenaltyPctPerDay = input.latePenaltyPctPerDay;
    po.latePenaltyCapPct = input.latePenaltyCapPct;
    po.amendments.push({
      at: nowIso(),
      by: actor.name,
      note: `Late penalty ${input.latePenaltyPctPerDay} % a day, capped at ${input.latePenaltyCapPct} %`,
    });
    logPo(store, actor, po, "Late penalty terms set", `${input.latePenaltyPctPerDay} % a day, cap ${input.latePenaltyCapPct} %`);
  });
};

/** Other cases: an advance, recovered automatically from the PO's invoices (finance §1 step 5). */
export const recordAdvancePayment = async (
  actor: Actor,
  uuid: string,
  input: AdvancePaymentInput,
): Promise<void> => {
  assertRole(actor.role, FINANCE_EDITORS, "record advance payments");
  transact((store) => {
    const po = findOrThrow(store.PurchaseOrders, uuid, "Purchase order");
    if (po.status === "pending_approval" || po.status === "rejected" || po.status === "cancelled") {
      throw new Error("Advances are paid on an approved PO");
    }
    if (po.advancePaid + input.amount > po.total) {
      throw new Error("The advance cannot exceed the PO total");
    }
    po.advancePaid = round2(po.advancePaid + input.amount);
    po.amendments.push({ at: nowIso(), by: actor.name, note: `Advance paid ${formatMoney(input.amount)}` });
    logPo(store, actor, po, "Advance payment recorded", formatMoney(input.amount));
  });
};

/** Receiving (§2): counted and checked, the accepted quantity added to stock at the PO price. */
export const receiveGoods = async (actor: Actor, poUuid: string, input: GoodsReceiptInput): Promise<GoodsReceipt> => {
  assertRole(actor.role, WAREHOUSE_EDITORS, "receive goods");
  const receivedAt = toIso(input.receivedAt);
  assertNotFuture(receivedAt);
  return transact((store) => {
    const po = findOrThrow(store.PurchaseOrders, poUuid, "Purchase order");
    findOrThrow(store.Warehouses, input.warehouseUuid, "Warehouse");
    const lines = input.lines.filter((l) => l.receivedQty > 0);
    const blocker = goodsReceiptBlocker(po, store.GoodsReceipts, lines);
    if (blocker) {
      throw new Error(blocker);
    }
    const receipt: GoodsReceipt = {
      uuid: generateUuid(),
      number: nextDocumentNumber("GRN", store.GoodsReceipts.map((r) => r.number)),
      poUuid,
      warehouseUuid: input.warehouseUuid,
      receivedAt,
      receivedBy: actor.name,
      lines: lines.map((l) => ({ ...l, rejectionReason: l.rejectionReason?.trim() || undefined })),
    };
    store.GoodsReceipts.push(receipt);
    for (const line of receipt.lines.filter((l) => l.acceptedQty > 0)) {
      // goodsReceiptBlocker has already refused any item that is not on the PO.
      const unitCost = po.lines.find((l) => l.itemUuid === line.itemUuid)?.unitPrice ?? 0;
      addMovement(store, {
        type: "receipt",
        itemUuid: line.itemUuid,
        warehouseUuid: input.warehouseUuid,
        qty: line.acceptedQty,
        unitCost,
        refKind: "goods_receipt",
        refUuid: receipt.uuid,
        refNumber: receipt.number,
        projectUuid: po.projectUuid,
        at: receivedAt,
        by: actor.name,
      });
    }
    const state = receiptState(po, store.GoodsReceipts);
    po.status = state.every((s) => s.outstanding === 0) ? "received" : "partially_received";
    recordRejectedAtReceipt(store, actor, po, receipt);
    settleRedelivered(store, po, receivedAt);
    const rejected = sumBy(receipt.lines, (l) => l.receivedQty - l.acceptedQty);
    logPo(store, actor, po, `Goods received — ${receipt.number}`, rejected > 0 ? `${rejected} rejected and returned to supplier` : undefined);
    return receipt;
  });
};

/** Step 13: once everything is in. */
export const evaluateSupplier = async (
  actor: Actor,
  poUuid: string,
  input: SupplierEvaluationInput,
): Promise<void> => {
  assertRole(actor.role, PROCUREMENT_EDITORS, "evaluate suppliers");
  transact((store) => {
    const po = findOrThrow(store.PurchaseOrders, poUuid, "Purchase order");
    if (po.status !== "received") {
      throw new Error("The supplier is evaluated once the PO is fully received");
    }
    if (po.evaluation) {
      throw new Error("This PO's supplier is already evaluated");
    }
    po.evaluation = { ...input, note: input.note?.trim() || undefined, at: nowIso(), by: actor.name };
    logPo(store, actor, po, "Supplier evaluated", `Quality ${input.quality}, on time ${input.onTime}, price ${input.price}`);
  });
};
