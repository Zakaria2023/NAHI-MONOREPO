// Every enum in the system, as `const` arrays with their union types. Labels
// live in label.ts.

// ─── People ────────────────────────────────────────────────────────────────

export const staffRoles = [
  "system_admin",
  "project_manager",
  "direct_manager",
  "procurement",
  "region_project_manager",
  "projects_manager",
  "finance_manager",
  "operations_manager",
  "deputy_gm",
  "warehouse_keeper",
  "region_accountant",
  "project_engineer",
  "accountant",
] as const satisfies readonly string[];

export type StaffRole = (typeof staffRoles)[number];

export const portalAccountKinds = [
  "customer",
  "subcontractor",
] as const satisfies readonly string[];

export type PortalAccountKind = (typeof portalAccountKinds)[number];

export const regions = [
  "central",
  "western",
  "eastern",
  "southern",
  "northern",
] as const satisfies readonly string[];

export type Region = (typeof regions)[number];

// ─── Projects ──────────────────────────────────────────────────────────────

export const operators = ["mobily", "stc"] as const satisfies readonly string[];

export type Operator = (typeof operators)[number];

export const mobilyStages = [
  "design_request",
  "po_issue",
  "mobilization",
  "permits",
  "implementation",
  "pat",
  "site_ho",
  "permit_ho",
  "remedy",
  "pcr_sdn",
  "certificates",
  "invoicing",
  "po_closure",
] as const satisfies readonly string[];

export type MobilyStage = (typeof mobilyStages)[number];

/** Every dated step of the Mobily cycle. Their stage lives in the services catalog. */
export const mobilySteps = [
  "site_survey",
  "design_package",
  "pr_requested",
  "po_received",
  "materials_delivered",
  "equipment_ready",
  "manpower_ready",
  "trench_excavation",
  "pipe_laying",
  "mh_installation",
  "concrete_backfilling",
  "concrete_samples",
  "milling_paving",
  "cable_pulling_splicing",
  "pat_submitted",
  "mandrel_test",
  "foc_e2e_test",
  "otdr_test",
  "oil_sheet_signed",
  "completion_certificate",
  "party_clearance",
  "final_clearance",
  "remedy_requested",
  "remedy_approved",
  "pcr_requested",
  "sdn_approved",
  "as_built_submitted",
  "rfs_submitted",
  "rfs_received",
  "pac_submitted",
  "pac_received",
  "fac_submitted",
  "fac_received",
  "po_closure_submitted",
  "po_closed",
] as const satisfies readonly string[];

export type MobilyStep = (typeof mobilySteps)[number];

export const permitAuthorities = [
  "mot",
  "municipality",
  "traffic",
  "amn",
  "service_authority",
] as const satisfies readonly string[];

export type PermitAuthority = (typeof permitAuthorities)[number];

export const laboratories = ["municipal", "mobily"] as const satisfies readonly string[];

export type Laboratory = (typeof laboratories)[number];

export const labTestSubjects = [
  "civil_works",
  "concrete_backfilling",
  "milling_paving",
] as const satisfies readonly string[];

export type LabTestSubject = (typeof labTestSubjects)[number];

export const labTestStatuses = [
  "pending",
  "passed",
  "failed",
] as const satisfies readonly string[];

export type LabTestStatus = (typeof labTestStatuses)[number];

export const certificateKinds = ["rfs", "pac", "fac"] as const satisfies readonly string[];

export type CertificateKind = (typeof certificateKinds)[number];

export const stcStages = [
  "design",
  "m2",
  "m3",
  "m4",
  "m5",
  "completed",
] as const satisfies readonly string[];

export type StcStage = (typeof stcStages)[number];

export const stcDocuments = [
  "permit_application",
  "permit_receipt",
  "baladiyah",
  "budget_calculator",
  "odf_tb_power_meter",
  "otdr_splice_average",
  "material_form",
  "ftr",
  "as_built",
  "c09",
  "m4_document",
  "ho_screenshot",
  "m5_acceptance",
] as const satisfies readonly string[];

export type StcDocumentKey = (typeof stcDocuments)[number];

export const stcParties = [
  "stc",
  "inspector",
  "supervisor",
  "stc_qc",
  "project_manager",
] as const satisfies readonly string[];

export type StcParty = (typeof stcParties)[number];

/** In the order STC requires them — each needs the one before it. */
export const stcPatSteps = [
  "gt_uploaded_ne",
  "npts_requested",
  "plate_marking",
  "pat_scheduled",
  "pat_completed",
] as const satisfies readonly string[];

export type StcPatStep = (typeof stcPatSteps)[number];

export const stcM3Checks = [
  "milestones_updated",
  "traces",
  "power_picture",
] as const satisfies readonly string[];

export type StcM3Check = (typeof stcM3Checks)[number];

export const documentStatuses = [
  "missing",
  "pending",
  "approved",
  "rejected",
] as const satisfies readonly string[];

export type DocumentStatus = (typeof documentStatuses)[number];

export const milestoneStatuses = [
  "open",
  "closed",
  "rejected",
] as const satisfies readonly string[];

export type MilestoneStatus = (typeof milestoneStatuses)[number];

// ─── Approvals ─────────────────────────────────────────────────────────────

export const approvalDecisions = [
  "approved",
  "rejected",
] as const satisfies readonly string[];

export type ApprovalDecision = (typeof approvalDecisions)[number];

// ─── Procurement ───────────────────────────────────────────────────────────

export const purchaseRequestStatuses = [
  "pending_manager",
  "in_review",
  "stock_approval",
  "fulfilled_from_stock",
  "rfq",
  "quote_approval",
  "ordered",
  "rejected",
] as const satisfies readonly string[];

export type PurchaseRequestStatus = (typeof purchaseRequestStatuses)[number];

export const purchaseOrderStatuses = [
  "pending_approval",
  "approved",
  "sent",
  "partially_received",
  "received",
  "cancelled",
  "rejected",
] as const satisfies readonly string[];

export type PurchaseOrderStatus = (typeof purchaseOrderStatuses)[number];

export const budgetCategories = [
  "civil_works",
  "fiber_works",
  "equipment",
  "fiber_materials",
  "civil_materials",
  "manpower",
  "permits",
  "overhead",
] as const satisfies readonly string[];

export type BudgetCategory = (typeof budgetCategories)[number];

/** What the supplier owes back for goods returned: a credit, or the goods again. */
export const supplierReturnRemedies = ["debit_note", "replacement"] as const satisfies readonly string[];

export type SupplierReturnRemedy = (typeof supplierReturnRemedies)[number];

export const supplierReturnStatuses = ["awaiting_replacement", "settled"] as const satisfies readonly string[];

export type SupplierReturnStatus = (typeof supplierReturnStatuses)[number];

/** Rejected at the receiving check, or found faulty after it went into stock. */
export const supplierReturnSources = ["rejected_at_receipt", "from_stock"] as const satisfies readonly string[];

export type SupplierReturnSource = (typeof supplierReturnSources)[number];

// ─── Warehouse ─────────────────────────────────────────────────────────────

export const itemCategories = [
  "fiber_material",
  "civil_material",
  "equipment",
  "tool",
  "safety",
  "consumable",
] as const satisfies readonly string[];

export type ItemCategory = (typeof itemCategories)[number];

export const itemKinds = ["consumable", "fixed_asset"] as const satisfies readonly string[];

export type ItemKind = (typeof itemKinds)[number];

export const stockMovementTypes = [
  "receipt",
  "issue",
  "transfer_out",
  "transfer_in",
  "adjustment",
  "write_off",
  "return",
] as const satisfies readonly string[];

export type StockMovementType = (typeof stockMovementTypes)[number];

export const recipientKinds = [
  "employee",
  "subcontractor",
  "cost_center",
] as const satisfies readonly string[];

export type RecipientKind = (typeof recipientKinds)[number];

export const issueRequestStatuses = [
  "pending_approval",
  "approved",
  "issued",
  "rejected",
] as const satisfies readonly string[];

export type IssueRequestStatus = (typeof issueRequestStatuses)[number];

export const inventoryFrequencies = [
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
] as const satisfies readonly string[];

export type InventoryFrequency = (typeof inventoryFrequencies)[number];

export const assetCustodyStatuses = [
  "with_employee",
  "returned",
  "lost",
  "damaged",
] as const satisfies readonly string[];

export type AssetCustodyStatus = (typeof assetCustodyStatuses)[number];

/** Shared by transfers, stocktakes and write-offs: one approval chain, then done. */
export const warehouseDocStatuses = [
  "pending_approval",
  "completed",
  "rejected",
] as const satisfies readonly string[];

export type WarehouseDocStatus = (typeof warehouseDocStatuses)[number];

export const writeOffReasons = [
  "damaged",
  "lost",
  "stolen",
  "expired",
] as const satisfies readonly string[];

export type WriteOffReason = (typeof writeOffReasons)[number];

export const writeOffDecisions = [
  "write_off",
  "charge_employee",
] as const satisfies readonly string[];

export type WriteOffDecision = (typeof writeOffDecisions)[number];

// ─── Custody ───────────────────────────────────────────────────────────────

export const cashCustodyStatuses = [
  "pending_approval",
  "approved",
  "disbursed",
  "settled",
  "rejected",
] as const satisfies readonly string[];

export type CashCustodyStatus = (typeof cashCustodyStatuses)[number];

// ─── Finance ───────────────────────────────────────────────────────────────

export const supplierInvoiceStatuses = [
  "registered",
  "approved",
  "paid",
  "rejected",
] as const satisfies readonly string[];

export type SupplierInvoiceStatus = (typeof supplierInvoiceStatuses)[number];

export const paymentMethods = ["bank_transfer", "cheque"] as const satisfies readonly string[];

export type PaymentMethod = (typeof paymentMethods)[number];

export const extractStatuses = [
  "submitted",
  "engineer_approved",
  "pm_approved",
  "approved",
  "paid",
  "rejected",
] as const satisfies readonly string[];

export type ExtractStatus = (typeof extractStatuses)[number];

export const customerInvoiceBases = [
  "rfs",
  "pac",
  "fac",
  "as_built",
] as const satisfies readonly string[];

export type CustomerInvoiceBasis = (typeof customerInvoiceBases)[number];

export const budgetStatuses = ["draft", "approved"] as const satisfies readonly string[];

export type BudgetStatus = (typeof budgetStatuses)[number];

export const closingItems = [
  "procurement_warehouse",
  "bank_reconciliation",
  "supplier_balances",
  "customer_balances",
  "custody",
  "payroll",
  "depreciation",
  "accruals_prepayments",
  "financial_statements",
] as const satisfies readonly string[];

export type ClosingItem = (typeof closingItems)[number];

// ─── Audit ─────────────────────────────────────────────────────────────────

export const entityKinds = [
  "project",
  "purchase_request",
  "quotation",
  "purchase_order",
  "supplier_contract",
  "supplier_return",
  "goods_receipt",
  "issue_request",
  "stock_transfer",
  "stocktake",
  "write_off",
  "cash_custody",
  "asset_custody",
  "clearance",
  "supplier",
  "supplier_invoice",
  "subcontract",
  "extract",
  "customer_invoice",
  "budget",
  "closing",
  "system",
] as const satisfies readonly string[];

export type EntityKind = (typeof entityKinds)[number];
