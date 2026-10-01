import { PillTone } from "ui";
import {
  CashCustodyStatus,
  DocumentStatus,
  ExtractStatus,
  IssueRequestStatus,
  LabTestStatus,
  MilestoneStatus,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  SupplierInvoiceStatus,
  WarehouseDocStatus,
} from "@/db/enum";

// One colour per state, everywhere: green done, amber waiting on someone,
// dark in progress, red refused or late, grey not started.

export const PR_TONES: Record<PurchaseRequestStatus, PillTone> = {
  pending_manager: "warning",
  in_review: "info",
  stock_approval: "warning",
  fulfilled_from_stock: "success",
  rfq: "info",
  quote_approval: "warning",
  ordered: "success",
  rejected: "danger",
};

export const PO_TONES: Record<PurchaseOrderStatus, PillTone> = {
  pending_approval: "warning",
  approved: "info",
  sent: "info",
  partially_received: "warning",
  received: "success",
  cancelled: "neutral",
  rejected: "danger",
};

export const DOCUMENT_TONES: Record<DocumentStatus, PillTone> = {
  missing: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export const LAB_TONES: Record<LabTestStatus, PillTone> = {
  pending: "warning",
  passed: "success",
  failed: "danger",
};

export const MILESTONE_TONES: Record<MilestoneStatus, PillTone> = {
  open: "info",
  closed: "success",
  rejected: "danger",
};

export const ISSUE_TONES: Record<IssueRequestStatus, PillTone> = {
  pending_approval: "warning",
  approved: "info",
  issued: "success",
  rejected: "danger",
};

export const WAREHOUSE_DOC_TONES: Record<WarehouseDocStatus, PillTone> = {
  pending_approval: "warning",
  completed: "success",
  rejected: "danger",
};

export const CASH_CUSTODY_TONES: Record<CashCustodyStatus, PillTone> = {
  pending_approval: "warning",
  approved: "info",
  disbursed: "info",
  settled: "success",
  rejected: "danger",
};

export const SUPPLIER_INVOICE_TONES: Record<SupplierInvoiceStatus, PillTone> = {
  registered: "warning",
  approved: "info",
  paid: "success",
  rejected: "danger",
};

export const EXTRACT_TONES: Record<ExtractStatus, PillTone> = {
  submitted: "warning",
  engineer_approved: "warning",
  pm_approved: "warning",
  approved: "info",
  paid: "success",
  rejected: "danger",
};
