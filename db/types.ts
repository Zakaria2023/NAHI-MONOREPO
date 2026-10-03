import {
  ApprovalDecision,
  AssetCustodyStatus,
  BudgetCategory,
  BudgetStatus,
  CashCustodyStatus,
  CertificateKind,
  ClosingItem,
  CustomerInvoiceBasis,
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

// THE SCHEMA. One type per table; `Store` maps each table's PascalCase plural
// name to its rows. Timestamps are ISO strings, money is SAR rounded to 2 dp.

// ─── Shared shapes ─────────────────────────────────────────────────────────

/** A dated step someone completed: a Mobily step, an STC PAT step, a closing tick. */
export type StepRecord = {
  at: string;
  by: string;
  note?: string;
};

/** One decision in an approval chain. `role` is the chain position it answered. */
export type Approval = {
  role: StaffRole;
  decision: ApprovalDecision;
  actorName: string;
  at: string;
  note?: string;
};

export type QuantityLine = {
  itemUuid: string;
  qty: number;
};

export type PricedLine = QuantityLine & {
  unitPrice: number;
};

// ─── People ────────────────────────────────────────────────────────────────

/** Everyone the app can act as. A plain employee's account points at their payroll record. */
export type StaffUser = {
  uuid: string;
  name: string;
  email: string;
  role: StaffRole;
  region: Region;
  /** The payroll employee this account belongs to, when there is one. */
  employeeUuid?: string;
};

export type PortalAccount = {
  uuid: string;
  name: string;
  email: string;
  kind: PortalAccountKind;
  /** Set for a customer account — which operator's sites it sees. */
  operator?: Operator;
  /** Set for a subcontractor account. */
  subcontractorUuid?: string;
};

// ─── Projects ──────────────────────────────────────────────────────────────

export type MobilyPermit = {
  uuid: string;
  authority: PermitAuthority;
  reference: string;
  requestedAt: string;
  /** Expected validity in days, entered with the request (rule 2). */
  durationDays: number;
  issuedAt?: string;
};

export type LabTest = {
  uuid: string;
  lab: Laboratory;
  subject: LabTestSubject;
  status: LabTestStatus;
  testedAt?: string;
  note?: string;
};

export type MobilyWorkflow = {
  steps: Partial<Record<MobilyStep, StepRecord>>;
  permits: MobilyPermit[];
  labTests: LabTest[];
};

export type StcDocumentApproval = {
  party: StcParty;
  decision: ApprovalDecision;
  at: string;
  by: string;
  note?: string;
};

export type StcDocument = {
  key: StcDocumentKey;
  uploadedAt?: string;
  fileName?: string;
  approvals: StcDocumentApproval[];
};

export type StcMilestone = {
  /** Quantity above the PO, or a UPL added — both need a C09 (rule 6). */
  qtyIncreased: boolean;
  newUpl: boolean;
  inspectorApprovedAt?: string;
  supervisorApprovedAt?: string;
  status: MilestoneStatus;
  closedAt?: string;
  rejectionReason?: string;
};

export type StcWorkflow = {
  stage: StcStage;
  designClosedAt?: string;
  /** Appears in ISOW when STC approves the design; the 24h wait starts here. */
  designEndDate?: string;
  /** Generated when Permit Application and Permit Receipt are approved (rule 2). */
  m2EndDate?: string;
  sentToSupervisorAt?: string;
  inspectorName?: string;
  inspectorAssignedAt?: string;
  patSteps: Partial<Record<StcPatStep, StepRecord>>;
  m3Checks: Partial<Record<StcM3Check, StepRecord>>;
  /** Appears when RFS is approved. */
  m3EndDate?: string;
  milestone: StcMilestone;
  documents: StcDocument[];
  dashboardAt?: string;
  stageHistory: { stage: StcStage; at: string; by: string }[];
};

export type Project = {
  uuid: string;
  code: string;
  name: string;
  operator: Operator;
  region: Region;
  city: string;
  siteName: string;
  /** Customer PO — Mobily issues it in stage 2; STC projects carry it from award. */
  poNumber?: string;
  poValue: number;
  projectManagerName: string;
  createdAt: string;
  mobily?: MobilyWorkflow;
  stc?: StcWorkflow;
};

// ─── Master data ───────────────────────────────────────────────────────────

export type Supplier = {
  uuid: string;
  name: string;
  vatNumber: string;
  crNumber: string;
  address: string;
  email: string;
  phone: string;
  createdAt: string;
};

export type Item = {
  uuid: string;
  code: string;
  name: string;
  category: ItemCategory;
  kind: ItemKind;
  unit: string;
  reorderLevel: number;
  standardCost: number;
};

export type Warehouse = {
  uuid: string;
  code: string;
  name: string;
  city: string;
  region: Region;
};

// ─── Procurement ───────────────────────────────────────────────────────────

export type PurchaseRequestLine = QuantityLine & {
  estUnitPrice: number;
  expectedDate: string;
};

export type PurchaseRequest = {
  uuid: string;
  number: string;
  projectUuid: string;
  department: string;
  budgetCategory: BudgetCategory;
  requestedBy: string;
  lines: PurchaseRequestLine[];
  status: PurchaseRequestStatus;
  approvals: Approval[];
  /** The quotation-approval chain's decisions, kept apart from the PR's own. */
  quoteApprovals: Approval[];
  /** Procurement's finding at review: true sends it down the stock route. */
  stockAvailable?: boolean;
  selectedQuotationUuid?: string;
  note?: string;
  createdAt: string;
};

export type Quotation = {
  uuid: string;
  number: string;
  prUuid: string;
  supplierUuid: string;
  lines: PricedLine[];
  deliveryDays: number;
  paymentTermsDays: number;
  /** Procurement's 1–5 view of the offer's quality, for the comparison. */
  qualityScore: number;
  /** An earlier quotation the management already approved, attached instead of three new ones. */
  previouslyApproved: boolean;
  requestedByEmailAt: string;
  receivedAt: string;
};

export type SupplierEvaluation = {
  quality: number;
  onTime: number;
  price: number;
  note?: string;
  at: string;
  by: string;
};

export type PurchaseOrder = {
  uuid: string;
  number: string;
  prUuid: string;
  /** The approved quotation it came from — absent for a call-off under an annual contract. */
  quotationUuid?: string;
  contractUuid?: string;
  supplierUuid: string;
  projectUuid: string;
  budgetCategory: BudgetCategory;
  lines: PricedLine[];
  subtotal: number;
  vat: number;
  total: number;
  deliveryDays: number;
  paymentTermsDays: number;
  status: PurchaseOrderStatus;
  approvals: Approval[];
  sentAt?: string;
  expectedDeliveryAt?: string;
  /** Paid to the supplier up front; recovered from its invoices automatically. */
  advancePaid: number;
  /** Contract late-delivery penalty, % of the invoiced value per day late, capped. */
  latePenaltyPctPerDay?: number;
  latePenaltyCapPct?: number;
  amendments: { at: string; by: string; note: string }[];
  evaluation?: SupplierEvaluation;
  createdAt: string;
};

export type GoodsReceiptLine = {
  itemUuid: string;
  receivedQty: number;
  acceptedQty: number;
  rejectionReason?: string;
};

export type GoodsReceipt = {
  uuid: string;
  number: string;
  poUuid: string;
  warehouseUuid: string;
  receivedAt: string;
  receivedBy: string;
  lines: GoodsReceiptLine[];
};

/** An annual agreement: repeat POs at agreed prices, without a new RFQ (procurement §1, other cases). */
export type SupplierContract = {
  uuid: string;
  number: string;
  supplierUuid: string;
  title: string;
  startsAt: string;
  endsAt: string;
  lines: { itemUuid: string; unitPrice: number }[];
  deliveryDays: number;
  paymentTermsDays: number;
  latePenaltyPctPerDay: number;
  latePenaltyCapPct: number;
  createdBy: string;
  createdAt: string;
};

/** Goods sent back to the supplier, against a debit note or a replacement. */
export type SupplierReturn = {
  uuid: string;
  number: string;
  poUuid: string;
  supplierUuid: string;
  grnUuid?: string;
  warehouseUuid: string;
  source: SupplierReturnSource;
  lines: PricedLine[];
  reason: string;
  remedy: SupplierReturnRemedy;
  status: SupplierReturnStatus;
  subtotal: number;
  vat: number;
  total: number;
  /** Set for a debit note; what is still to be deducted is `total` less what was applied. */
  debitNoteNumber?: string;
  appliedToInvoices: { invoiceUuid: string; amount: number }[];
  createdBy: string;
  createdAt: string;
  settledAt?: string;
};

// ─── Warehouse ─────────────────────────────────────────────────────────────

export type ChargedTo = {
  kind: RecipientKind;
  name: string;
  subcontractorUuid?: string;
};

export type StockMovement = {
  uuid: string;
  type: StockMovementType;
  itemUuid: string;
  warehouseUuid: string;
  /** Signed: positive into the warehouse, negative out of it. */
  qty: number;
  unitCost: number;
  refKind: EntityKind;
  refUuid: string;
  refNumber: string;
  projectUuid?: string;
  chargedTo?: ChargedTo;
  at: string;
  by: string;
};

export type IssueRequest = {
  uuid: string;
  number: string;
  projectUuid: string;
  warehouseUuid: string;
  requestedBy: string;
  recipient: ChargedTo;
  lines: QuantityLine[];
  /** How often custody items in this request are counted with the employee. */
  inventoryFrequency?: InventoryFrequency;
  status: IssueRequestStatus;
  approvals: Approval[];
  /** The issue note's three signatures. */
  signedByRecipient?: string;
  signedByKeeper?: string;
  issuedAt?: string;
};

export type AssetCustody = {
  uuid: string;
  itemUuid: string;
  qty: number;
  employeeName: string;
  issueRequestUuid: string;
  projectUuid: string;
  inventoryFrequency: InventoryFrequency;
  issuedAt: string;
  lastCountedAt?: string;
  status: AssetCustodyStatus;
  closedAt?: string;
};

export type StockTransfer = {
  uuid: string;
  number: string;
  fromWarehouseUuid: string;
  toWarehouseUuid: string;
  lines: QuantityLine[];
  status: WarehouseDocStatus;
  approvals: Approval[];
  requestedBy: string;
  createdAt: string;
  completedAt?: string;
};

export type StocktakeLine = {
  itemUuid: string;
  bookQty: number;
  actualQty: number;
};

export type Stocktake = {
  uuid: string;
  number: string;
  warehouseUuid: string;
  countedAt: string;
  countedBy: string;
  lines: StocktakeLine[];
  status: WarehouseDocStatus;
  approvals: Approval[];
};

export type WriteOff = {
  uuid: string;
  number: string;
  warehouseUuid: string;
  lines: QuantityLine[];
  reason: WriteOffReason;
  investigation: string;
  decision: WriteOffDecision;
  chargedEmployee?: string;
  status: WarehouseDocStatus;
  approvals: Approval[];
  requestedBy: string;
  createdAt: string;
};

// ─── Custody ───────────────────────────────────────────────────────────────

export type CashCustodyLine = {
  description: string;
  amount: number;
};

export type CashCustody = {
  uuid: string;
  number: string;
  employeeName: string;
  projectUuid: string;
  budgetCategory: BudgetCategory;
  city: string;
  workOrderNo: string;
  amount: number;
  lines: CashCustodyLine[];
  status: CashCustodyStatus;
  approvals: Approval[];
  disbursedAt?: string;
  receiptSignedAt?: string;
  settlement?: { spent: number; returned: number; settledAt: string; by: string; note?: string };
  createdAt: string;
};

export type Clearance = {
  uuid: string;
  employeeName: string;
  reason: "resignation" | "transfer";
  approvedAt: string;
  approvedBy: string;
};

// ─── Finance ───────────────────────────────────────────────────────────────

export type SupplierPayment = {
  uuid: string;
  at: string;
  method: PaymentMethod;
  reference: string;
  amount: number;
  by: string;
  /** When the payment notice went to the supplier's e-mail. */
  noticeSentAt: string;
  /** The account it left; absent on older records = the primary account. */
  bankAccountUuid?: string;
  chequeUuid?: string;
};

export type SupplierInvoice = {
  uuid: string;
  number: string;
  supplierUuid: string;
  invoiceNumber: string;
  invoiceDate: string;
  poUuid: string;
  grnUuids: string[];
  subtotal: number;
  vat: number;
  total: number;
  /** Advance recovered from this invoice, worked out when it was registered. */
  advanceDeducted: number;
  /** Open debit notes of the supplier set off against this invoice. */
  debitNotesDeducted?: number;
  /** Late-delivery penalty under the PO's contract terms. */
  latePenalty?: number;
  netPayable: number;
  dueDate: string;
  status: SupplierInvoiceStatus;
  payments: SupplierPayment[];
  registeredBy: string;
  approvedBy?: string;
  createdAt: string;
};

export type Subcontractor = {
  uuid: string;
  name: string;
  vatNumber: string;
  crNumber: string;
  email: string;
  phone: string;
};

export type Subcontract = {
  uuid: string;
  number: string;
  subcontractorUuid: string;
  projectUuid: string;
  scope: string;
  budgetCategory: BudgetCategory;
  value: number;
  retentionPct: number;
  advancePaid: number;
  createdAt: string;
};

export type ExtractLine = {
  description: string;
  unit: string;
  qty: number;
  unitRate: number;
};

export type Extract = {
  uuid: string;
  number: string;
  subcontractUuid: string;
  periodFrom: string;
  periodTo: string;
  lines: ExtractLine[];
  gross: number;
  advanceDeduction: number;
  retention: number;
  penalties: number;
  penaltyNote?: string;
  materialsDeduction: number;
  net: number;
  status: ExtractStatus;
  approvals: Approval[];
  submittedVia: "portal" | "admin";
  submittedBy: string;
  createdAt: string;
  paidAt?: string;
};

export type CustomerInvoice = {
  uuid: string;
  number: string;
  projectUuid: string;
  basis: CustomerInvoiceBasis;
  amount: number;
  vat: number;
  total: number;
  /** Submitted on I-Supplier for Mobily; issued to STC otherwise. */
  submittedAt: string;
  dueAt: string;
  paidAt?: string;
  /** Where the collection went; absent = the primary account. */
  collectedToUuid?: string;
  collectionChequeUuid?: string;
  createdBy: string;
};

export type BudgetLine = {
  category: BudgetCategory;
  planned: number;
};

export type BudgetRevision = {
  at: string;
  by: string;
  reason: string;
  changes: { category: BudgetCategory; from: number; to: number }[];
};

/**
 * One line of the budget study (finance §4): civil and fiber works, materials,
 * equipment and manpower, each with its quantity and cost. Amount =
 * qty × unit cost × duration (duration 1 when it does not apply).
 */
export type BudgetStudyLine = {
  uuid: string;
  category: BudgetCategory;
  /** The work, the material, the equipment — or the job title, for manpower. */
  description: string;
  unit: string;
  /** Quantity — or headcount, for manpower. */
  qty: number;
  unitCost: number;
  /** Days or months of rent, or months of manpower. */
  duration?: number;
  supplyType?: EquipmentSupplyType;
  workType?: WorkType;
};

/** A row of the study's timelines: when materials, manpower or equipment are needed on site. */
export type BudgetScheduleItem = {
  uuid: string;
  resource: StudyResource;
  description: string;
  startsAt: string;
  endsAt: string;
};

export type ProjectBudget = {
  uuid: string;
  projectUuid: string;
  status: BudgetStatus;
  lines: BudgetLine[];
  approvedAt?: string;
  approvedBy?: string;
  revisions: BudgetRevision[];
  study?: BudgetStudyLine[];
  schedule?: BudgetScheduleItem[];
};

/** A cost centre other than a project (every project is one of its own). */
export type CostCenter = {
  uuid: string;
  code: string;
  name: string;
  kind: CostCenterKind;
};

/**
 * A manual expense entry. It cannot be recorded without a cost centre, and a
 * vehicle expense is split over exactly two (finance §4, controls).
 */
export type Expense = {
  uuid: string;
  number: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  /** The budget line it counts against when charged to a project. */
  budgetCategory: BudgetCategory;
  amount: number;
  vat: number;
  /** A project uuid or a cost centre's uuid, with the share of `amount`. */
  allocations: { costCenterUuid: string; amount: number }[];
  createdBy: string;
  createdAt: string;
};

/** A month's overhead spread over the projects on a set basis (finance §4). */
export type OverheadAllocation = {
  uuid: string;
  period: string;
  basis: OverheadBasis;
  pool: number;
  poolParts: { expenses: number; payroll: number; depreciation: number };
  lines: { projectUuid: string; basisValue: number; amount: number }[];
  postedBy: string;
  postedAt: string;
};

export type ClosingPeriod = {
  uuid: string;
  period: string;
  items: Partial<Record<ClosingItem, StepRecord>>;
  closedAt?: string;
  closedBy?: string;
};

// ─── Payroll ───────────────────────────────────────────────────────────────

/** Someone on the payroll — field staff and daily workers, not only the system's users. */
export type Employee = {
  uuid: string;
  code: string;
  name: string;
  jobTitle: string;
  nationality: Nationality;
  employmentType: EmploymentType;
  /** Monthly figures; zero for a daily worker. */
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  /** Set for a daily worker. */
  dailyRate?: number;
  iban: string;
  bankName: string;
  /** Where the cost goes when a timesheet does not split it. Absent = head office. */
  defaultProjectUuid?: string;
  joinedAt: string;
  active: boolean;
};

/** One employee's month: days per project, absences, overtime. */
export type Timesheet = {
  uuid: string;
  employeeUuid: string;
  /** "2026-09". */
  period: string;
  /** Days worked per project; a missing `projectUuid` is head office. */
  allocations: { projectUuid?: string; days: number }[];
  absentDays: number;
  overtimeHours: number;
  submittedBy: string;
  submittedAt: string;
};

/** A daily worker's day on site — what the attendance app records. */
export type AttendanceEntry = {
  uuid: string;
  employeeUuid: string;
  /** The day, as an ISO timestamp at midnight UTC. */
  date: string;
  projectUuid: string;
  hours: number;
  source: AttendanceSource;
  recordedBy: string;
};

/** One employee's pay for a run, fixed when the run is calculated. */
export type Payslip = {
  employeeUuid: string;
  employeeCode: string;
  employeeName: string;
  jobTitle: string;
  nationality: Nationality;
  employmentType: EmploymentType;
  iban: string;
  bankName: string;
  workedDays: number;
  absentDays: number;
  overtimeHours: number;
  basic: number;
  housing: number;
  transport: number;
  overtime: number;
  /** Earnings before deductions. */
  gross: number;
  absenceDeduction: number;
  gosiEmployee: number;
  net: number;
  /** The company's own share — a cost, not a deduction. */
  gosiEmployer: number;
  /** What the employee costs (gross − absence + employer GOSI), split by days per project. */
  costAllocations: { projectUuid?: string; days: number; amount: number }[];
};

export type PayrollRun = {
  uuid: string;
  number: string;
  period: string;
  status: PayrollRunStatus;
  payslips: Payslip[];
  approvals: Approval[];
  createdBy: string;
  createdAt: string;
  paidAt?: string;
  paidBy?: string;
  bankReference?: string;
};

// ─── Fixed assets ──────────────────────────────────────────────────────────

/** Where an asset is kept: a warehouse, or an employee who holds it. */
export type AssetHolder = {
  kind: AssetHolderKind;
  warehouseUuid?: string;
  employeeName?: string;
};

/** The asset card of finance §7. Depreciation is straight-line and computed, never stored per asset. */
export type FixedAsset = {
  uuid: string;
  number: string;
  name: string;
  category: AssetCategory;
  serialNumber: string;
  purchaseDate: string;
  cost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  holder: AssetHolder;
  /** The project its depreciation is charged to; absent = head office. */
  projectUuid?: string;
  status: AssetStatus;
  transfers: { at: string; by: string; from: AssetHolder; to: AssetHolder; note?: string }[];
  /** The annual count: was it found, and in what state. */
  counts: { at: string; by: string; found: boolean; condition: string }[];
  disposal?: {
    at: string;
    by: string;
    kind: AssetDisposalKind;
    proceeds: number;
    bookValue: number;
    gainLoss: number;
    note?: string;
  };
  createdBy: string;
  createdAt: string;
};

/** A month's depreciation, posted once — what the closing checklist looks for. */
export type DepreciationRun = {
  uuid: string;
  period: string;
  lines: { assetUuid: string; amount: number }[];
  total: number;
  postedBy: string;
  postedAt: string;
};

// ─── Banking and obligations ───────────────────────────────────────────────

export type BankAccount = {
  uuid: string;
  code: string;
  name: string;
  bank: string;
  iban: string;
  openingBalance: number;
  openingDate: string;
  /** Payments and collections recorded without an account go through this one. */
  primary: boolean;
};

/**
 * A cheque, issued with a supplier payment or received with a customer
 * collection. Post-dated until its due date; booked when written, on the bank
 * statement when cleared. A bounced cheque undoes the payment or collection.
 */
export type Cheque = {
  uuid: string;
  number: string;
  direction: ChequeDirection;
  bankAccountUuid: string;
  party: string;
  amount: number;
  issuedAt: string;
  dueDate: string;
  status: ChequeStatus;
  ref: { kind: "supplier_invoice" | "customer_invoice"; uuid: string; label: string; paymentUuid?: string };
  clearedAt?: string;
  bouncedAt?: string;
  bounceReason?: string;
};

/** A month's bank reconciliation: the statement against the book, explained by uncleared cheques. */
export type BankReconciliation = {
  uuid: string;
  bankAccountUuid: string;
  period: string;
  statementBalance: number;
  bookBalance: number;
  outstandingIssued: number;
  uncreditedReceived: number;
  by: string;
  at: string;
};

export type LetterOfGuarantee = {
  uuid: string;
  number: string;
  bank: string;
  kind: GuaranteeKind;
  beneficiary: string;
  projectUuid?: string;
  amount: number;
  issuedAt: string;
  expiresAt: string;
  releasedAt?: string;
  note?: string;
};

/** The supplier's own statement, matched against the system's balance (finance §1 step 9). */
export type SupplierStatementCheck = {
  uuid: string;
  supplierUuid: string;
  asOf: string;
  reportedBalance: number;
  systemBalance: number;
  difference: number;
  note?: string;
  by: string;
  at: string;
};

/** A VAT return or a GOSI payment, filed for a month. */
export type TaxFiling = {
  uuid: string;
  kind: ObligationKind;
  period: string;
  amount: number;
  reference: string;
  filedAt: string;
  by: string;
};

// ─── Tasks ─────────────────────────────────────────────────────────────────

/** One line of a task's checklist; the task is not handed in until each is ticked. */
export type TaskChecklistItem = {
  uuid: string;
  text: string;
  doneAt?: string;
  doneBy?: string;
};

/** A day of work the assignee logged against the task. `date` is the day worked. */
export type TaskWorkLog = {
  uuid: string;
  date: string;
  hours: number;
  note?: string;
  by: string;
  at: string;
};

export type TaskComment = {
  uuid: string;
  at: string;
  by: string;
  text: string;
};

/**
 * Work one staff member gives another (or themselves). Who gave it reviews it:
 * the assignee hands it in, and only the giver accepts it as done.
 */
export type Task = {
  uuid: string;
  number: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  /** The staff member doing it. */
  assigneeUuid: string;
  /** Who gave it — and who reviews it once it is handed in. */
  assignedByUuid: string;
  projectUuid?: string;
  dueAt: string;
  createdAt: string;
  /** When it reached its current assignee: the creation, or the last reassignment. */
  assignedAt: string;
  /** When the current assignee first opened it. Cleared on reassignment. */
  seenAt?: string;
  startedAt?: string;
  /** The last time it was handed in as finished. */
  submittedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  /** Why it is on hold, was sent back or was cancelled — the latest of these. */
  reason?: string;
  /** How many times the reviewer sent it back to work. */
  returnedCount: number;
  checklist: TaskChecklistItem[];
  workLogs: TaskWorkLog[];
  comments: TaskComment[];
};

// ─── Audit ─────────────────────────────────────────────────────────────────

export type ActivityEntry = {
  uuid: string;
  at: string;
  actorName: string;
  entity: EntityKind;
  entityUuid: string;
  entityLabel: string;
  action: string;
  detail?: string;
};

// ─── The store ─────────────────────────────────────────────────────────────

export type Store = {
  StaffUsers: StaffUser[];
  PortalAccounts: PortalAccount[];
  Projects: Project[];
  Suppliers: Supplier[];
  Items: Item[];
  Warehouses: Warehouse[];
  PurchaseRequests: PurchaseRequest[];
  Quotations: Quotation[];
  PurchaseOrders: PurchaseOrder[];
  SupplierContracts: SupplierContract[];
  SupplierReturns: SupplierReturn[];
  GoodsReceipts: GoodsReceipt[];
  StockMovements: StockMovement[];
  IssueRequests: IssueRequest[];
  AssetCustodies: AssetCustody[];
  StockTransfers: StockTransfer[];
  Stocktakes: Stocktake[];
  WriteOffs: WriteOff[];
  CashCustodies: CashCustody[];
  Clearances: Clearance[];
  SupplierInvoices: SupplierInvoice[];
  Subcontractors: Subcontractor[];
  Subcontracts: Subcontract[];
  Extracts: Extract[];
  CustomerInvoices: CustomerInvoice[];
  ProjectBudgets: ProjectBudget[];
  ClosingPeriods: ClosingPeriod[];
  Employees: Employee[];
  Timesheets: Timesheet[];
  AttendanceEntries: AttendanceEntry[];
  PayrollRuns: PayrollRun[];
  FixedAssets: FixedAsset[];
  DepreciationRuns: DepreciationRun[];
  CostCenters: CostCenter[];
  Expenses: Expense[];
  OverheadAllocations: OverheadAllocation[];
  BankAccounts: BankAccount[];
  Cheques: Cheque[];
  BankReconciliations: BankReconciliation[];
  LettersOfGuarantee: LetterOfGuarantee[];
  SupplierStatementChecks: SupplierStatementCheck[];
  TaxFilings: TaxFiling[];
  Tasks: Task[];
  Activity: ActivityEntry[];
};
