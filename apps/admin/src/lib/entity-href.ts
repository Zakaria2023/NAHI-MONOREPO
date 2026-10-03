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
    case "supplier_contract":
      return `/procurement/contracts/${uuid}`;
    case "supplier_return":
      return "/procurement/returns";
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
    case "employee":
      return "/payroll/employees";
    case "timesheet":
      return "/payroll/timesheets";
    case "payroll_run":
      return `/payroll/runs/${uuid}`;
    case "fixed_asset":
      return `/finance/assets/${uuid}`;
    case "depreciation":
      return "/finance/depreciation";
    case "expense":
    case "cost_center":
      return "/finance/expenses";
    case "overhead_allocation":
      return "/finance/overhead";
    case "bank_account":
      return `/finance/bank?account=${uuid}`;
    case "cheque":
      return "/finance/cheques";
    case "guarantee":
      return "/finance/guarantees";
    case "tax_filing":
      return "/finance/obligations";
    case "budget":
      return `/finance/budgets/${uuid}`;
    case "closing":
      return "/finance/closing";
    case "task":
      return `/tasks/${uuid}`;
    case "system":
      return "/warehouse/stock";
  }
};
