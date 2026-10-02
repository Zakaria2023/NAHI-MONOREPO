import { formatPeriod, recentPeriods, round2, sumBy } from "utils";
import { STOCK_MOVEMENT_TYPE_LABELS } from "../../../../db/label";
import { Store } from "../../../../db/types";
import { averageCost } from "../core/stock";
import { CUSTODY_SETTLEMENT_DAYS } from "../custody";
import { linesTotal, receiptState } from "../rules/procurement";
import { nextCountAt } from "../warehouse";
import { ReportData, ReportParams, col } from "./report";

// PROCUREMENT, WAREHOUSE AND CUSTODY REPORTS (procurement §6).

const DAY_MS = 24 * 60 * 60 * 1000;

const itemName = (store: Store, uuid: string) => {
  const item = store.Items.find((i) => i.uuid === uuid);
  return item ? `${item.code} — ${item.name}` : "?";
};
const supplierName = (store: Store, uuid: string) => store.Suppliers.find((s) => s.uuid === uuid)?.name ?? "?";
const projectCode = (store: Store, uuid?: string) => (uuid ? (store.Projects.find((p) => p.uuid === uuid)?.code ?? "") : "");
const daysBetween = (from: string, to: string) => Math.floor((new Date(to).getTime() - new Date(from).getTime()) / DAY_MS);

/** Receipts and issues (الوارد والمنصرف) for a month. */
export const receiptsAndIssues = (store: Store, params: ReportParams, now: string): ReportData => {
  const periods = recentPeriods(6, now);
  const period = params.period && periods.includes(params.period) ? params.period : periods[0];
  const moves = store.StockMovements.filter((m) => m.at.slice(0, 7) === period).sort((a, b) => a.at.localeCompare(b.at));
  const valueIn = round2(sumBy(moves.filter((m) => m.qty > 0), (m) => m.qty * m.unitCost));
  const valueOut = round2(sumBy(moves.filter((m) => m.qty < 0), (m) => -m.qty * m.unitCost));
  return {
    choices: [{ param: "period", label: "Month", options: periods.map((p) => ({ value: p, label: formatPeriod(p) })), selected: period }],
    figures: [
      { label: "Received in", value: valueIn, kind: "money" },
      { label: "Issued out", value: valueOut, kind: "money" },
      { label: "Movements", value: moves.length, kind: "number" },
    ],
    columns: [
      col("at", "Date", "date"),
      col("type", "Movement"),
      col("item", "Item"),
      col("warehouse", "Warehouse"),
      col("ref", "Document"),
      col("project", "Project / charged to"),
      col("in", "In", "number"),
      col("out", "Out", "number"),
      col("value", "Value", "money"),
    ],
    rows: moves.map((m) => ({
      key: m.uuid,
      cells: {
        at: m.at,
        type: STOCK_MOVEMENT_TYPE_LABELS[m.type],
        item: itemName(store, m.itemUuid),
        warehouse: store.Warehouses.find((w) => w.uuid === m.warehouseUuid)?.code ?? "",
        ref: m.refNumber,
        project: m.chargedTo ? `${projectCode(store, m.projectUuid)} ${m.chargedTo.name}`.trim() : projectCode(store, m.projectUuid),
        in: m.qty > 0 ? m.qty : null,
        out: m.qty < 0 ? -m.qty : null,
        value: round2(Math.abs(m.qty) * m.unitCost),
      },
    })),
  };
};

/** Stocktake differences (تقرير الفروقات والجرد). */
export const stocktakeDifferences = (store: Store): ReportData => {
  const rows = store.Stocktakes.flatMap((st) =>
    st.lines
      .filter((l) => l.actualQty !== l.bookQty)
      .map((l) => {
        const difference = round2(l.actualQty - l.bookQty);
        return {
          key: `${st.uuid}-${l.itemUuid}`,
          cells: {
            number: st.number,
            at: st.countedAt,
            warehouse: store.Warehouses.find((w) => w.uuid === st.warehouseUuid)?.code ?? "",
            item: itemName(store, l.itemUuid),
            book: l.bookQty,
            actual: l.actualQty,
            difference,
            value: round2(difference * averageCost(store, l.itemUuid)),
            status: st.status === "completed" ? "Settled" : st.status === "rejected" ? "Rejected" : "Awaiting approval",
          },
        };
      }),
  );
  return {
    figures: [
      { label: "Lines with a difference", value: rows.length, kind: "number" },
      { label: "Net value of differences", value: round2(sumBy(rows, (r) => Number(r.cells.value))), kind: "money" },
    ],
    columns: [
      col("number", "Stocktake"),
      col("at", "Counted", "date"),
      col("warehouse", "Warehouse"),
      col("item", "Item"),
      col("book", "Book", "number"),
      col("actual", "Counted", "number"),
      col("difference", "Difference", "number"),
      col("value", "Value", "money"),
      col("status", "Status"),
    ],
    rows,
  };
};

/** Custody overdue or not returned (العهد المتأخرة أو غير المرجعة). */
export const overdueCustody = (store: Store, _params: ReportParams, now: string): ReportData => {
  const assets = store.AssetCustodies.filter((c) => c.status === "with_employee" && nextCountAt(c) < now).map((c) => ({
    key: c.uuid,
    cells: {
      kind: "Asset — count overdue",
      what: `${itemName(store, c.itemUuid)} × ${c.qty}`,
      employee: c.employeeName,
      since: nextCountAt(c),
      days: daysBetween(nextCountAt(c), now),
      amount: round2(c.qty * averageCost(store, c.itemUuid)),
    },
  }));
  const cash = store.CashCustodies.filter((c) => c.status === "disbursed" && c.disbursedAt && daysBetween(c.disbursedAt, now) > CUSTODY_SETTLEMENT_DAYS).map((c) => ({
    key: c.uuid,
    cells: {
      kind: "Cash — not settled",
      what: c.number,
      employee: c.employeeName,
      since: c.disbursedAt ?? "",
      days: daysBetween(c.disbursedAt ?? now, now) - CUSTODY_SETTLEMENT_DAYS,
      amount: c.amount,
    },
  }));
  const open = store.CashCustodies.filter((c) => c.status === "disbursed" && !cash.some((x) => x.key === c.uuid)).map((c) => ({
    key: `open-${c.uuid}`,
    cells: { kind: "Cash — open, not yet due", what: c.number, employee: c.employeeName, since: c.disbursedAt ?? "", days: 0, amount: c.amount },
  }));
  return {
    note: `Cash custody is due for settlement ${CUSTODY_SETTLEMENT_DAYS} days after it is disbursed; an asset in custody is due for its count at its set frequency.`,
    columns: [col("kind", "Custody"), col("what", "What"), col("employee", "Employee"), col("since", "Due since", "date"), col("days", "Days overdue", "number"), col("amount", "Value", "money")],
    rows: [...assets, ...cash, ...open],
  };
};

/** Open and late purchase orders (أوامر الشراء المفتوحة والمتأخرة). */
export const openLatePurchaseOrders = (store: Store, _params: ReportParams, now: string): ReportData => {
  const open = store.PurchaseOrders.filter((p) => ["pending_approval", "approved", "sent", "partially_received"].includes(p.status));
  const rows = open.map((po) => {
    const state = receiptState(po, store.GoodsReceipts);
    const ordered = sumBy(state, (s) => s.ordered);
    const accepted = sumBy(state, (s) => s.accepted);
    const late = Boolean(po.expectedDeliveryAt && po.expectedDeliveryAt < now);
    return {
      key: po.uuid,
      href: `/procurement/orders/${po.uuid}`,
      cells: {
        number: po.number,
        supplier: supplierName(store, po.supplierUuid),
        project: projectCode(store, po.projectUuid),
        status: po.status.replace(/_/g, " "),
        total: po.total,
        received: ordered > 0 ? accepted / ordered : 0,
        expected: po.expectedDeliveryAt ?? null,
        late: late ? daysBetween(po.expectedDeliveryAt ?? now, now) : null,
      },
    };
  });
  return {
    figures: [
      { label: "Open POs", value: rows.length, kind: "number" },
      { label: "Late", value: rows.filter((r) => r.cells.late !== null).length, kind: "number" },
      { label: "Open value", value: round2(sumBy(open, (p) => p.total)), kind: "money" },
    ],
    columns: [
      col("number", "PO"),
      col("supplier", "Supplier"),
      col("project", "Project"),
      col("status", "Status"),
      col("total", "Total", "money"),
      col("received", "Received", "percent"),
      col("expected", "Expected delivery", "date"),
      col("late", "Days late", "number"),
    ],
    rows,
  };
};

/** Supplier price comparison: each item's price from each supplier — quoted, ordered, under contract. */
export const supplierPriceComparison = (store: Store): ReportData => {
  const pairs = new Map<string, { item: string; supplier: string; quoted?: number; ordered?: number; contract?: number }>();
  const touch = (itemUuid: string, supplierUuid: string) => {
    const key = `${itemUuid}|${supplierUuid}`;
    const row = pairs.get(key) ?? { item: itemUuid, supplier: supplierUuid };
    pairs.set(key, row);
    return row;
  };
  for (const q of [...store.Quotations].sort((a, b) => a.receivedAt.localeCompare(b.receivedAt))) {
    for (const l of q.lines) {
      touch(l.itemUuid, q.supplierUuid).quoted = l.unitPrice;
    }
  }
  for (const po of [...store.PurchaseOrders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    for (const l of po.lines) {
      touch(l.itemUuid, po.supplierUuid).ordered = l.unitPrice;
    }
  }
  for (const c of store.SupplierContracts) {
    for (const l of c.lines) {
      touch(l.itemUuid, c.supplierUuid).contract = l.unitPrice;
    }
  }
  const all = [...pairs.values()];
  const best = (itemUuid: string) =>
    Math.min(...all.filter((r) => r.item === itemUuid).map((r) => Math.min(r.contract ?? Infinity, r.ordered ?? Infinity, r.quoted ?? Infinity)));
  return {
    note: "The latest price each supplier quoted, last ordered at and agreed under an annual contract; the lowest for each item is marked.",
    columns: [col("item", "Item"), col("supplier", "Supplier"), col("quoted", "Last quoted", "money"), col("ordered", "Last ordered", "money"), col("contract", "Contract", "money"), col("lowest", "Lowest")],
    rows: all
      .sort((a, b) => itemName(store, a.item).localeCompare(itemName(store, b.item)))
      .map((r) => {
        const lowest = Math.min(r.contract ?? Infinity, r.ordered ?? Infinity, r.quoted ?? Infinity);
        return {
          key: `${r.item}-${r.supplier}`,
          cells: {
            item: itemName(store, r.item),
            supplier: supplierName(store, r.supplier),
            quoted: r.quoted ?? null,
            ordered: r.ordered ?? null,
            contract: r.contract ?? null,
            lowest: lowest === best(r.item) ? "Lowest" : "",
          },
        };
      }),
  };
};

/** An item's price history: every quotation, PO and contract price, over time. */
export const itemPriceHistory = (store: Store, params: ReportParams): ReportData => {
  const priced = new Set([
    ...store.Quotations.flatMap((q) => q.lines.map((l) => l.itemUuid)),
    ...store.PurchaseOrders.flatMap((p) => p.lines.map((l) => l.itemUuid)),
    ...store.SupplierContracts.flatMap((c) => c.lines.map((l) => l.itemUuid)),
  ]);
  const items = store.Items.filter((i) => priced.has(i.uuid));
  const selected = items.find((i) => i.uuid === params.item)?.uuid ?? items[0]?.uuid ?? "";
  const rows = [
    ...store.Quotations.flatMap((q) =>
      q.lines.filter((l) => l.itemUuid === selected).map((l) => ({ at: q.receivedAt, source: `Quotation ${q.number}`, supplier: q.supplierUuid, price: l.unitPrice })),
    ),
    ...store.PurchaseOrders.flatMap((p) =>
      p.lines.filter((l) => l.itemUuid === selected).map((l) => ({ at: p.createdAt, source: `PO ${p.number}`, supplier: p.supplierUuid, price: l.unitPrice })),
    ),
    ...store.SupplierContracts.flatMap((c) =>
      c.lines.filter((l) => l.itemUuid === selected).map((l) => ({ at: c.startsAt, source: `Contract ${c.number}`, supplier: c.supplierUuid, price: l.unitPrice })),
    ),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const standard = store.Items.find((i) => i.uuid === selected)?.standardCost ?? 0;
  return {
    choices: [{ param: "item", label: "Item", options: items.map((i) => ({ value: i.uuid, label: `${i.code} — ${i.name}` })), selected }],
    figures: [
      { label: "Standard cost", value: standard, kind: "money" },
      { label: "Lowest paid", value: rows.length > 0 ? Math.min(...rows.map((r) => r.price)) : null, kind: "money" },
      { label: "Average stock cost", value: selected ? averageCost(store, selected) : null, kind: "money" },
    ],
    columns: [col("at", "Date", "date"), col("source", "Source"), col("supplier", "Supplier"), col("price", "Unit price", "money"), col("vsStandard", "Against standard", "percent")],
    rows: rows.map((r, index) => ({
      key: String(index),
      cells: { at: r.at, source: r.source, supplier: supplierName(store, r.supplier), price: r.price, vsStandard: standard > 0 ? r.price / standard - 1 : null },
    })),
  };
};

/** Supplier performance (تقييم أداء الموردين): evaluations, delivery on time, returns, penalties. */
export const supplierPerformance = (store: Store): ReportData => ({
  note: "Scores are the evaluations recorded at the end of each fully received PO, out of 5. On time compares each PO's last receipt with its expected delivery.",
  columns: [
    col("supplier", "Supplier"),
    col("pos", "POs", "number"),
    col("ordered", "Ordered", "money"),
    col("onTime", "Delivered on time", "percent"),
    col("quality", "Quality", "number"),
    col("punctuality", "Punctuality", "number"),
    col("price", "Price", "number"),
    col("returns", "Returns", "number"),
    col("penalties", "Late penalties", "money"),
  ],
  rows: store.Suppliers.map((s) => {
    const pos = store.PurchaseOrders.filter((p) => p.supplierUuid === s.uuid && p.status !== "rejected" && p.status !== "cancelled");
    const delivered = pos.filter((p) => p.expectedDeliveryAt && store.GoodsReceipts.some((r) => r.poUuid === p.uuid));
    const onTime = delivered.filter((p) => {
      const last = store.GoodsReceipts.filter((r) => r.poUuid === p.uuid).map((r) => r.receivedAt).sort().at(-1) ?? "";
      return last <= (p.expectedDeliveryAt ?? "");
    });
    const evaluations = pos.flatMap((p) => (p.evaluation ? [p.evaluation] : []));
    const avg = (pick: (e: (typeof evaluations)[number]) => number) => (evaluations.length > 0 ? round2(sumBy(evaluations, pick) / evaluations.length) : null);
    return {
      key: s.uuid,
      cells: {
        supplier: s.name,
        pos: pos.length,
        ordered: round2(sumBy(pos, (p) => p.total)),
        onTime: delivered.length > 0 ? onTime.length / delivered.length : null,
        quality: avg((e) => e.quality),
        punctuality: avg((e) => e.onTime),
        price: avg((e) => e.price),
        returns: store.SupplierReturns.filter((r) => r.supplierUuid === s.uuid).length,
        penalties: round2(sumBy(store.SupplierInvoices.filter((i) => i.supplierUuid === s.uuid), (i) => i.latePenalty ?? 0)),
      },
    };
  }),
});

/** Approved purchases by department (المشتريات المعتمدة حسب الإدارة). */
export const purchasesByDepartment = (store: Store): ReportData => {
  const approved = store.PurchaseRequests.filter((pr) => !["pending_manager", "rejected"].includes(pr.status));
  const departments = [...new Set(approved.map((pr) => pr.department))].sort();
  return {
    columns: [col("department", "Department"), col("requests", "Approved requests", "number"), col("estimate", "Estimated", "money"), col("ordered", "Ordered on POs", "money"), col("stock", "Supplied from stock", "number")],
    rows: departments.map((department) => {
      const mine = approved.filter((pr) => pr.department === department);
      const pos = store.PurchaseOrders.filter((po) => mine.some((pr) => pr.uuid === po.prUuid) && po.status !== "cancelled" && po.status !== "rejected");
      return {
        key: department,
        cells: {
          department,
          requests: mine.length,
          estimate: round2(sumBy(mine, (pr) => sumBy(pr.lines, (l) => l.qty * l.estUnitPrice))),
          ordered: round2(sumBy(pos, (p) => linesTotal(p.lines))),
          stock: mine.filter((pr) => pr.status === "fulfilled_from_stock").length,
        },
      };
    }),
  };
};
