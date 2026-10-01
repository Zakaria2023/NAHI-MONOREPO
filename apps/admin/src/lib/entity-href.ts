import { EntityKind } from "@/db/enum";

/** Where an alert, an approval or a log entry about `kind` opens. */
export const entityHref = (kind: EntityKind, uuid: string): string => {
  switch (kind) {
    case "project":
      return `/projects/${uuid}`;
    case "purchase_request":
    case "quotation":
      return `/procurement/requests/${uuid}`;
    case "purchase_order":
    case "goods_receipt":
      return `/procurement/orders/${uuid}`;
    case "issue_request":
      return `/warehouse/issue-requests/${uuid}`;
    case "stock_transfer":
      return `/warehouse/transfers/${uuid}`;
    case "stocktake":
      return `/warehouse/stocktakes/${uuid}`;
    case "write_off":
      return `/warehouse/write-offs/${uuid}`;
    case "asset_custody":
      return "/warehouse/custody";
    case "cash_custody":
      return `/custody/${uuid}`;
    case "clearance":
      return "/custody/employees";
    case "supplier":
      return "/procurement/suppliers";
    case "supplier_invoice":
      return `/finance/payables/${uuid}`;
    case "subcontract":
      return "/finance/subcontracts";
    case "extract":
      return `/finance/extracts/${uuid}`;
    case "customer_invoice":
      return "/finance/receivables";
    case "budget":
      return `/finance/budgets/${uuid}`;
    case "closing":
      return "/finance/closing";
    case "system":
      return "/warehouse/stock";
  }
};
