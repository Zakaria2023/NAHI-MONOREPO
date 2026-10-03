import {
  ApprovalDecision,
  AssetCustodyStatus,
  BudgetCategory,
  BudgetStatus,
  CashCustodyStatus,
  CertificateKind,
  ClosingItem,
  CustomerInvoiceBasis,
  DocumentStatus,
  EntityKind,
  ExtractStatus,
  InventoryFrequency,
  IssueRequestStatus,
  ItemCategory,
  ItemKind,
  LabTestStatus,
  LabTestSubject,
  Laboratory,
  MilestoneStatus,
  MobilyStage,
  MobilyStep,
  Operator,
  PaymentMethod,
  PermitAuthority,
  PortalAccountKind,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  RecipientKind,
  Region,
  StaffRole,
  StcDocumentKey,
  StcM3Check,
  StcParty,
  StcPatStep,
  StcStage,
  StockMovementType,
  SupplierInvoiceStatus,
  ChequeDirection,
  ChequeStatus,
  GuaranteeKind,
  ObligationKind,
  CostCenterKind,
  EquipmentSupplyType,
  ExpenseCategory,
  OverheadBasis,
  StudyResource,
  WorkType,
  AssetCategory,
  AssetDisposalKind,
  AssetHolderKind,
  AssetStatus,
  AttendanceSource,
  EmploymentType,
  Nationality,
  PayrollRunStatus,
  SupplierReturnRemedy,
  SupplierReturnSource,
  SupplierReturnStatus,
  TaskPriority,
  TaskStatus,
  WarehouseDocStatus,
  WriteOffDecision,
  WriteOffReason,
} from "./enum";

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  system_admin: "System admin",
  project_manager: "Project manager",
  direct_manager: "Direct manager",
  procurement: "Procurement",
  region_project_manager: "Region project manager",
  projects_manager: "Projects manager (company)",
  finance_manager: "Finance manager",
  operations_manager: "Operations manager",
  deputy_gm: "Deputy general manager",
  warehouse_keeper: "Storekeeper",
  region_accountant: "Region accountant",
  project_engineer: "Project engineer",
  accountant: "Accountant",
  employee: "Employee",
};

export const PORTAL_ACCOUNT_KIND_LABELS: Record<PortalAccountKind, string> = {
  customer: "Customer",
  subcontractor: "Subcontractor",
};

export const REGION_LABELS: Record<Region, string> = {
  central: "Central",
  western: "Western",
  eastern: "Eastern",
  southern: "Southern",
  northern: "Northern",
};

export const OPERATOR_LABELS: Record<Operator, string> = {
  mobily: "Mobily",
  stc: "STC",
};

export const MOBILY_STAGE_LABELS: Record<MobilyStage, string> = {
  design_request: "Design request",
  po_issue: "PO issue",
  mobilization: "Mobilization",
  permits: "Permits",
  implementation: "Implementation",
  pat: "PAT request",
  site_ho: "Site HO",
  permit_ho: "Permit HO",
  remedy: "Remedy approval",
  pcr_sdn: "PCR & SDN",
  certificates: "Certificates",
  invoicing: "Invoicing",
  po_closure: "PO closure",
};

export const MOBILY_STEP_LABELS: Record<MobilyStep, string> = {
  site_survey: "Site survey",
  design_package: "Design package submitted",
  pr_requested: "PR requested (Mobily internal)",
  po_received: "PO received",
  materials_delivered: "Materials delivered in full (one batch)",
  equipment_ready: "Equipment & safety tools",
  manpower_ready: "Manpower",
  trench_excavation: "Trench excavation",
  pipe_laying: "Pipe laying",
  mh_installation: "MH installation",
  concrete_backfilling: "Concrete backfilling",
  concrete_samples: "Concrete samples submitted",
  milling_paving: "Milling & paving",
  cable_pulling_splicing: "Cable pulling & splicing",
  pat_submitted: "PAT documents submitted",
  mandrel_test: "Mandrel test",
  foc_e2e_test: "FOC end-to-end test",
  otdr_test: "OTDR test",
  oil_sheet_signed: "Oil Sheet signed",
  completion_certificate: "Stage 1 — Certificate of Completion of Work",
  party_clearance: "Stage 2 — Party Clearance Certificate",
  final_clearance: "Stage 3 — Final Clearance Certificate",
  remedy_requested: "Remedy approval requested",
  remedy_approved: "Remedy approval received",
  pcr_requested: "PCR requested",
  sdn_approved: "SDN approved",
  as_built_submitted: "As-built quantities submitted",
  rfs_submitted: "RFS documents submitted on NAS",
  rfs_received: "RFS certificate received",
  pac_submitted: "PAC documents submitted on NAS",
  pac_received: "PAC certificate received",
  fac_submitted: "FAC documents submitted on NAS",
  fac_received: "FAC certificate received",
  po_closure_submitted: "PO closure submitted",
  po_closed: "PO closed",
};

export const PERMIT_AUTHORITY_LABELS: Record<PermitAuthority, string> = {
  mot: "MOT",
  municipality: "Municipality",
  traffic: "Traffic",
  amn: "AMN",
  service_authority: "Service authority",
};

export const LABORATORY_LABELS: Record<Laboratory, string> = {
  municipal: "Municipal Laboratory",
  mobily: "Mobily Laboratory",
};

export const LAB_TEST_SUBJECT_LABELS: Record<LabTestSubject, string> = {
  civil_works: "Civil works",
  concrete_backfilling: "Concrete backfilling",
  milling_paving: "Milling & paving",
};

export const LAB_TEST_STATUS_LABELS: Record<LabTestStatus, string> = {
  pending: "Pending",
  passed: "Passed",
  failed: "Failed",
};

export const CERTIFICATE_LABELS: Record<CertificateKind, string> = {
  rfs: "RFS",
  pac: "PAC",
  fac: "FAC",
};

export const STC_STAGE_LABELS: Record<StcStage, string> = {
  design: "Design",
  m2: "M2 — Permit",
  m3: "M3 — Implementation / RFS",
  m4: "M4",
  m5: "M5",
  completed: "On dashboard",
};

export const STC_DOCUMENT_LABELS: Record<StcDocumentKey, string> = {
  permit_application: "Permit Application",
  permit_receipt: "Permit Receipt",
  baladiyah: "Baladiyah",
  budget_calculator: "Budget Calculator",
  odf_tb_power_meter: "ODF to TB Power Meter",
  otdr_splice_average: "OTDR Splice Average",
  material_form: "Material Form",
  ftr: "FTR",
  as_built: "As-Built",
  c09: "C09",
  m4_document: "M4 document",
  ho_screenshot: "HO screenshot (PM)",
  m5_acceptance: "M5 acceptance",
};

export const STC_PARTY_LABELS: Record<StcParty, string> = {
  stc: "STC",
  inspector: "Inspector",
  supervisor: "Supervisor",
  stc_qc: "STC QC",
  project_manager: "Project manager",
};

export const STC_PAT_STEP_LABELS: Record<StcPatStep, string> = {
  gt_uploaded_ne: "GT uploaded on NE (after SDQC approval)",
  npts_requested: "Upload requested on NPTS",
  plate_marking: "Plate marking prepared per GT",
  pat_scheduled: "PAT schedule set by STC",
  pat_completed: "PAT completed for the whole site",
};

export const STC_M3_CHECK_LABELS: Record<StcM3Check, string> = {
  milestones_updated: "Milestones updated (material quantities)",
  traces: "Traces",
  power_picture: "Power picture",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  missing: "Missing",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  open: "Open",
  closed: "Closed",
  rejected: "Rejected",
};

export const APPROVAL_DECISION_LABELS: Record<ApprovalDecision, string> = {
  approved: "Approved",
  rejected: "Rejected",
};

export const PURCHASE_REQUEST_STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  pending_manager: "Awaiting direct manager",
  in_review: "Procurement review",
  stock_approval: "Stock supply approval",
  fulfilled_from_stock: "Supplied from stock",
  rfq: "Collecting quotations",
  quote_approval: "Quotation approval",
  ordered: "PO issued",
  rejected: "Rejected",
};

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  pending_approval: "Awaiting approval",
  approved: "Approved",
  sent: "Sent to supplier",
  partially_received: "Partially received",
  received: "Received",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategory, string> = {
  civil_works: "Civil works",
  fiber_works: "Fiber works",
  equipment: "Equipment",
  fiber_materials: "Fiber materials",
  civil_materials: "Civil materials",
  manpower: "Manpower",
  permits: "Permits",
  overhead: "Overhead",
};

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  fiber_material: "Fiber material",
  civil_material: "Civil material",
  equipment: "Equipment",
  tool: "Tool",
  safety: "Safety",
  consumable: "Consumable",
};

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  consumable: "Consumable",
  fixed_asset: "Fixed asset (custody)",
};

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  receipt: "Receipt",
  issue: "Issue",
  transfer_out: "Transfer out",
  transfer_in: "Transfer in",
  adjustment: "Stocktake adjustment",
  write_off: "Write-off",
  return: "Return",
};

export const RECIPIENT_KIND_LABELS: Record<RecipientKind, string> = {
  employee: "Employee",
  subcontractor: "Subcontractor",
  cost_center: "Cost center",
};

export const ISSUE_REQUEST_STATUS_LABELS: Record<IssueRequestStatus, string> = {
  pending_approval: "Awaiting region PM",
  approved: "Approved",
  issued: "Issued",
  rejected: "Rejected",
};

export const INVENTORY_FREQUENCY_LABELS: Record<InventoryFrequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannual: "Semi-annual",
  annual: "Annual",
};

export const ASSET_CUSTODY_STATUS_LABELS: Record<AssetCustodyStatus, string> = {
  with_employee: "With employee",
  returned: "Returned",
  lost: "Lost",
  damaged: "Damaged",
};

export const WAREHOUSE_DOC_STATUS_LABELS: Record<WarehouseDocStatus, string> = {
  pending_approval: "Awaiting approval",
  completed: "Completed",
  rejected: "Rejected",
};

export const WRITE_OFF_REASON_LABELS: Record<WriteOffReason, string> = {
  damaged: "Damaged",
  lost: "Lost",
  stolen: "Stolen",
  expired: "Expired",
};

export const WRITE_OFF_DECISION_LABELS: Record<WriteOffDecision, string> = {
  write_off: "Write off",
  charge_employee: "Charge to employee",
};

export const CASH_CUSTODY_STATUS_LABELS: Record<CashCustodyStatus, string> = {
  pending_approval: "Awaiting approval",
  approved: "Approved",
  disbursed: "Disbursed",
  settled: "Settled",
  rejected: "Rejected",
};

export const SUPPLIER_INVOICE_STATUS_LABELS: Record<SupplierInvoiceStatus, string> = {
  registered: "Registered",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
};

export const EXTRACT_STATUS_LABELS: Record<ExtractStatus, string> = {
  submitted: "Awaiting project engineer",
  engineer_approved: "Awaiting projects manager",
  pm_approved: "Awaiting finance",
  approved: "Approved — posted for payment",
  paid: "Paid",
  rejected: "Rejected",
};

export const CUSTOMER_INVOICE_BASIS_LABELS: Record<CustomerInvoiceBasis, string> = {
  rfs: "RFS certificate",
  pac: "PAC certificate",
  fac: "FAC certificate",
  as_built: "As-built extract",
};

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  draft: "Draft",
  approved: "Approved",
};

export const CLOSING_ITEM_LABELS: Record<ClosingItem, string> = {
  procurement_warehouse: "Procurement & warehouse closed (no pending documents)",
  bank_reconciliation: "Bank reconciliation",
  supplier_balances: "Supplier balances reconciled with statements",
  customer_balances: "Customer balances reconciled",
  custody: "Custody closed (no open custody)",
  payroll: "Payroll closed",
  depreciation: "Depreciation computed and posted",
  accruals_prepayments: "Accruals, prepayments and suspense accounts reviewed",
  financial_statements: "Financial statements issued",
};

export const ENTITY_KIND_LABELS: Record<EntityKind, string> = {
  project: "Project",
  purchase_request: "Purchase request",
  quotation: "Quotation",
  purchase_order: "Purchase order",
  supplier_contract: "Annual contract",
  supplier_return: "Supplier return",
  goods_receipt: "Goods receipt",
  issue_request: "Issue request",
  stock_transfer: "Stock transfer",
  stocktake: "Stocktake",
  write_off: "Write-off",
  cash_custody: "Cash custody",
  asset_custody: "Asset custody",
  clearance: "Clearance",
  supplier: "Supplier",
  supplier_invoice: "Supplier invoice",
  subcontract: "Subcontract",
  extract: "Extract",
  customer_invoice: "Customer invoice",
  employee: "Employee",
  timesheet: "Timesheet",
  payroll_run: "Payroll run",
  fixed_asset: "Fixed asset",
  depreciation: "Depreciation",
  expense: "Expense",
  cost_center: "Cost centre",
  overhead_allocation: "Overhead allocation",
  bank_account: "Bank account",
  cheque: "Cheque",
  guarantee: "Letter of guarantee",
  tax_filing: "Tax filing",
  budget: "Budget",
  closing: "Monthly closing",
  task: "Task",
  system: "System",
};

export const SUPPLIER_RETURN_REMEDY_LABELS: Record<SupplierReturnRemedy, string> = {
  debit_note: "Debit note",
  replacement: "Replacement",
};

export const SUPPLIER_RETURN_STATUS_LABELS: Record<SupplierReturnStatus, string> = {
  awaiting_replacement: "Awaiting replacement",
  settled: "Settled",
};

export const SUPPLIER_RETURN_SOURCE_LABELS: Record<SupplierReturnSource, string> = {
  rejected_at_receipt: "Rejected at receipt",
  from_stock: "Returned from stock",
};

export const NATIONALITY_LABELS: Record<Nationality, string> = {
  saudi: "Saudi",
  non_saudi: "Non-Saudi",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  monthly: "Monthly salary",
  daily: "Daily worker",
};

export const PAYROLL_RUN_STATUS_LABELS: Record<PayrollRunStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  paid: "Paid",
};

export const ATTENDANCE_SOURCE_LABELS: Record<AttendanceSource, string> = {
  attendance_app: "Attendance app",
  admin: "Entered in admin",
};

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  vehicles: "Vehicles",
  heavy_equipment: "Heavy equipment",
  test_equipment: "Test & splicing equipment",
  tools: "Tools",
  it_equipment: "IT equipment",
  furniture: "Furniture & fittings",
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  active: "In use",
  disposed: "Disposed",
};

export const ASSET_DISPOSAL_KIND_LABELS: Record<AssetDisposalKind, string> = {
  sale: "Sold",
  scrap: "Scrapped",
};

export const ASSET_HOLDER_KIND_LABELS: Record<AssetHolderKind, string> = {
  warehouse: "Warehouse",
  employee: "Employee custody",
};

export const STUDY_RESOURCE_LABELS: Record<StudyResource, string> = {
  materials: "Materials",
  manpower: "Manpower",
  equipment: "Equipment",
};

export const EQUIPMENT_SUPPLY_TYPE_LABELS: Record<EquipmentSupplyType, string> = {
  daily_rent: "Daily rent",
  monthly_rent: "Monthly rent",
  company_asset: "Company asset",
};

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  civil: "Civil",
  fiber: "Fiber",
};

export const COST_CENTER_KIND_LABELS: Record<CostCenterKind | "project", string> = {
  project: "Project",
  department: "Department",
  vehicle: "Vehicle",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  vehicle: "Vehicle (maintenance, insurance)",
  fuel: "Fuel",
  office: "Office and rent",
  utilities: "Utilities",
  travel: "Travel and accommodation",
  communications: "Communications",
  other: "Other",
};

export const OVERHEAD_BASIS_LABELS: Record<OverheadBasis, string> = {
  revenue: "Revenue invoiced",
  direct_cost: "Direct cost to date",
  equal: "Equal shares",
};

export const CHEQUE_DIRECTION_LABELS: Record<ChequeDirection, string> = {
  issued: "Issued",
  received: "Received",
};

export const CHEQUE_STATUS_LABELS: Record<ChequeStatus, string> = {
  pending: "Pending",
  cleared: "Cleared",
  bounced: "Bounced",
};

export const GUARANTEE_KIND_LABELS: Record<GuaranteeKind, string> = {
  bid: "Bid bond",
  performance: "Performance",
  advance_payment: "Advance payment",
  retention: "Retention release",
};

export const OBLIGATION_KIND_LABELS: Record<ObligationKind, string> = {
  vat: "VAT return",
  gosi: "Social insurance (GOSI)",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  on_hold: "On hold",
  in_review: "Waiting for review",
  done: "Done",
  cancelled: "Cancelled",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};
