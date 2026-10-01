import "server-only";
import {
  listCashCustodies,
  listExtracts,
  listItems,
  listProjects,
  listPurchaseOrders,
  listPurchaseRequests,
  listSubcontractors,
  listSupplierInvoices,
  listSuppliers,
  listWarehouseDocuments,
} from "services";
import { GuideExampleLink, GuideExamples } from "@/lib/guide";

/** Picks the record that shows a page best — by its number, else the first there is. */
const pick = <T extends { uuid: string }>(rows: T[], label: (row: T) => string, preferred: string): GuideExampleLink | undefined => {
  const row = rows.find((r) => label(r) === preferred) ?? rows[0];
  return row ? { uuid: row.uuid, label: label(row) } : undefined;
};

/** One real record behind each dynamic page of the guide, so every row opens something. */
export const resolveGuideExamples = async (): Promise<GuideExamples> => {
  const [projects, requests, orders, items, documents, custodies, invoices, suppliers, subcontractors, extracts] = await Promise.all([
    listProjects(),
    listPurchaseRequests(),
    listPurchaseOrders(),
    listItems(),
    listWarehouseDocuments(),
    listCashCustodies(),
    listSupplierInvoices(),
    listSuppliers(),
    listSubcontractors(),
    listExtracts(),
  ]);
  const docsOf = (kind: (typeof documents)[number]["kind"]) => documents.filter((d) => d.kind === kind);
  return {
    mobily: pick(projects.filter((p) => p.operator === "mobily"), (p) => p.code, "MOB-001"),
    stc: pick(projects.filter((p) => p.operator === "stc"), (p) => p.code, "STC-002"),
    pr: pick(requests, (r) => r.number, "PR-0002"),
    po: pick(orders, (o) => o.number, "PO-0001"),
    item: pick(items, (i) => i.code, "SPC-024"),
    issue: pick(docsOf("issue_request"), (d) => d.number, "IR-0001"),
    transfer: pick(docsOf("stock_transfer"), (d) => d.number, "TR-0001"),
    stocktake: pick(docsOf("stocktake"), (d) => d.number, "ST-0001"),
    writeOff: pick(docsOf("write_off"), (d) => d.number, "WO-0001"),
    custody: pick(custodies, (c) => c.number, "CC-0001"),
    invoice: pick(invoices, (i) => i.number, "AP-0001"),
    supplier: pick(suppliers, (s) => s.name, "Arab Cables Co."),
    subcontractor: pick(subcontractors, (s) => s.name, "Al-Bina Contracting"),
    extract: pick(extracts, (e) => e.number, "EX-0002"),
  };
};
