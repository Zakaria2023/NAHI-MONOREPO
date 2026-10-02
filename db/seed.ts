import { addDays, addHours, generateUuid, round2 } from "utils";
import { BudgetCategory, StaffRole, StcDocumentKey, StcParty } from "./enum";
import { deriveActivity } from "./seed-activity";
import { addExtraDemoData } from "./seed-extra";
import { addMoreDemoData } from "./seed-more";
import {
  Approval,
  Item,
  MobilyWorkflow,
  PricedLine,
  Project,
  StaffUser,
  StcDocument,
  StcWorkflow,
  StepRecord,
  StockMovement,
  Store,
} from "./types";

// DEMO DATA, dated relative to the moment it is built so the alerts it is meant
// to show (a permit about to expire, FAC almost due, the STC 24h countdown
// running, a late PO) are live whenever the store is reset.
//
// Every record here is placed to exercise one rule in docs/. Each project's
// comment says which.

type SeedOptions = {
  empty?: boolean;
};

const VAT = 0.15;

const PURCHASE_CHAIN: StaffRole[] = [
  "region_project_manager",
  "procurement",
  "projects_manager",
  "finance_manager",
  "operations_manager",
  "deputy_gm",
];

const emptyStore = (): Store => ({
  StaffUsers: [],
  PortalAccounts: [],
  Projects: [],
  Suppliers: [],
  Items: [],
  Warehouses: [],
  PurchaseRequests: [],
  Quotations: [],
  PurchaseOrders: [],
  SupplierContracts: [],
  SupplierReturns: [],
  GoodsReceipts: [],
  StockMovements: [],
  IssueRequests: [],
  AssetCustodies: [],
  StockTransfers: [],
  Stocktakes: [],
  WriteOffs: [],
  CashCustodies: [],
  Clearances: [],
  SupplierInvoices: [],
  Subcontractors: [],
  Subcontracts: [],
  Extracts: [],
  CustomerInvoices: [],
  ProjectBudgets: [],
  ClosingPeriods: [],
  Employees: [],
  Timesheets: [],
  AttendanceEntries: [],
  PayrollRuns: [],
  FixedAssets: [],
  DepreciationRuns: [],
  CostCenters: [],
  Expenses: [],
  OverheadAllocations: [],
  BankAccounts: [],
  Cheques: [],
  BankReconciliations: [],
  LettersOfGuarantee: [],
  SupplierStatementChecks: [],
  TaxFilings: [],
  Activity: [],
});

export const buildSeed = (now: string, options: SeedOptions = {}): Store => {
  const store = emptyStore();
  if (options.empty) {
    return store;
  }

  const ago = (days: number): string => addDays(now, -days);
  const ahead = (days: number): string => addDays(now, days);

  // ─── Staff: one per role, so the user switcher can walk every chain ──────

  const staff = (name: string, role: StaffRole, email: string): StaffUser => ({
    uuid: generateUuid(),
    name,
    email,
    role,
    region: "central",
  });

  store.StaffUsers = [
    staff("Nasser Al-Otaibi", "system_admin", "nasser@example.sa"),
    staff("Omar Al-Qahtani", "project_manager", "omar@example.sa"),
    staff("Khalid Al-Harbi", "direct_manager", "khalid@example.sa"),
    staff("Faisal Al-Shehri", "procurement", "faisal@example.sa"),
    staff("Majed Al-Dosari", "region_project_manager", "majed@example.sa"),
    staff("Yousef Al-Ghamdi", "projects_manager", "yousef@example.sa"),
    staff("Huda Al-Zahrani", "finance_manager", "huda@example.sa"),
    staff("Abdullah Al-Mutairi", "operations_manager", "abdullah@example.sa"),
    staff("Saad Al-Anazi", "deputy_gm", "saad@example.sa"),
    staff("Turki Al-Shammari", "warehouse_keeper", "turki@example.sa"),
    staff("Reem Al-Juhani", "region_accountant", "reem@example.sa"),
    staff("Saeed Al-Malki", "project_engineer", "saeed@example.sa"),
    staff("Lama Al-Subaie", "accountant", "lama@example.sa"),
  ];

  const nameOf = (role: StaffRole): string => {
    const user = store.StaffUsers.find((u) => u.role === role);
    if (!user) {
      throw new Error(`Seed has no staff user for ${role}`);
    }
    return user.name;
  };

  const step = (daysAgo: number, role: StaffRole = "project_manager"): StepRecord => ({
    at: ago(daysAgo),
    by: nameOf(role),
  });

  const approvals = (roles: StaffRole[], daysAgo: number): Approval[] =>
    roles.map((role, index) => ({
      role,
      decision: "approved",
      actorName: nameOf(role),
      at: ago(daysAgo - index * 0.2),
    }));

  // ─── Warehouses and items ────────────────────────────────────────────────

  const ruh = { uuid: generateUuid(), code: "WH-RUH", name: "Riyadh main store", city: "Riyadh", region: "central" as const };
  const jed = { uuid: generateUuid(), code: "WH-JED", name: "Jeddah store", city: "Jeddah", region: "western" as const };
  const dmm = { uuid: generateUuid(), code: "WH-DMM", name: "Dammam store", city: "Dammam", region: "eastern" as const };
  store.Warehouses = [ruh, jed, dmm];

  const item = (
    code: string,
    name: string,
    category: Item["category"],
    unit: string,
    reorderLevel: number,
    standardCost: number,
    kind: Item["kind"] = "consumable",
  ): Item => ({ uuid: generateUuid(), code, name, category, kind, unit, reorderLevel, standardCost });

  const fiber48 = item("FIB-048", "Fiber optic cable 48F", "fiber_material", "m", 5000, 4.2);
  const fiber96 = item("FIB-096", "Fiber optic cable 96F", "fiber_material", "m", 3000, 6.8);
  const duct = item("DUC-040", "HDPE duct 40mm", "civil_material", "m", 2000, 3.1);
  const manhole = item("MHL-001", "Precast manhole", "civil_material", "pcs", 10, 1450);
  const closure = item("SPC-024", "Splice closure 24F", "fiber_material", "pcs", 20, 180);
  const odf = item("ODF-024", "ODF 24 port", "fiber_material", "pcs", 10, 640);
  const tape = item("TAP-001", "Warning tape", "consumable", "roll", 30, 35);
  const helmet = item("SAF-001", "Safety helmet", "safety", "pcs", 25, 28);
  const splicer = item("EQP-SPL", "Fusion splicing machine", "equipment", "pcs", 1, 42000, "fixed_asset");
  const otdr = item("EQP-OTD", "OTDR tester", "equipment", "pcs", 1, 38000, "fixed_asset");
  store.Items = [fiber48, fiber96, duct, manhole, closure, odf, tape, helmet, splicer, otdr];

  const opening = (target: Item, warehouseUuid: string, qty: number): StockMovement => ({
    uuid: generateUuid(),
    type: "receipt",
    itemUuid: target.uuid,
    warehouseUuid,
    qty,
    unitCost: target.standardCost,
    refKind: "system",
    refUuid: "opening",
    refNumber: "OPENING",
    at: ago(90),
    by: nameOf("warehouse_keeper"),
  });

  store.StockMovements = [
    opening(fiber48, ruh.uuid, 12000),
    opening(fiber96, ruh.uuid, 2400), // under its reorder level of 3000
    opening(duct, ruh.uuid, 6000),
    opening(manhole, ruh.uuid, 24),
    opening(closure, ruh.uuid, 60),
    opening(odf, ruh.uuid, 8), // under its reorder level of 10
    opening(tape, ruh.uuid, 80),
    opening(helmet, ruh.uuid, 40),
    opening(splicer, ruh.uuid, 3),
    opening(otdr, ruh.uuid, 2),
    opening(fiber48, jed.uuid, 4000),
    opening(duct, jed.uuid, 1500),
    opening(manhole, jed.uuid, 6),
    opening(helmet, dmm.uuid, 20),
  ];

  // ─── Suppliers and subcontractors ────────────────────────────────────────

  const supplier = (name: string, vatNumber: string, crNumber: string, city: string, email: string) => ({
    uuid: generateUuid(),
    name,
    vatNumber,
    crNumber,
    address: `${city}, Saudi Arabia`,
    email,
    phone: "+966 11 000 0000",
    createdAt: ago(200),
  });

  const gulfFiber = supplier("Gulf Fiber Trading", "300123456700003", "1010123456", "Riyadh", "sales@gulffiber.example");
  const arabCables = supplier("Arab Cables Co.", "300987654300003", "4030987654", "Jeddah", "rfq@arabcables.example");
  const najdCivil = supplier("Najd Civil Supplies", "300555444300003", "1010555444", "Riyadh", "orders@najdcivil.example");
  const eastTech = supplier("Eastern Telecom Materials", "300777888900003", "2050777888", "Dammam", "info@easttech.example");
  store.Suppliers = [gulfFiber, arabCables, najdCivil, eastTech];

  const albina = { uuid: generateUuid(), name: "Al-Bina Contracting", vatNumber: "300111222300003", crNumber: "1010111222", email: "accounts@albina.example", phone: "+966 50 000 0001" };
  const fiberLink = { uuid: generateUuid(), name: "Fiber Link Co.", vatNumber: "300333444500003", crNumber: "4030333444", email: "billing@fiberlink.example", phone: "+966 50 000 0002" };
  store.Subcontractors = [albina, fiberLink];

  // ─── Mobily projects ─────────────────────────────────────────────────────

  const mobily = (workflow: Partial<MobilyWorkflow>): MobilyWorkflow => ({
    steps: {},
    permits: [],
    labTests: [],
    ...workflow,
  });

  // MOB-001 — in Implementation. One permit expires in 5 days (alert), one lab
  // test is still pending (rule 3), and the MOT permit is not issued yet.
  const mob1: Project = {
    uuid: generateUuid(),
    code: "MOB-001",
    name: "Olaya fiber extension",
    operator: "mobily",
    region: "central",
    city: "Riyadh",
    siteName: "RUH-OLY-117",
    poNumber: "MOB-PO-77812",
    poValue: 640000,
    projectManagerName: nameOf("project_manager"),
    createdAt: ago(75),
    mobily: mobily({
      steps: {
        site_survey: step(74),
        design_package: step(70),
        pr_requested: step(66),
        po_received: step(60),
        materials_delivered: step(52, "warehouse_keeper"),
        equipment_ready: step(51),
        manpower_ready: step(50),
        trench_excavation: step(18, "project_engineer"),
        pipe_laying: step(12, "project_engineer"),
      },
      permits: [
        { uuid: generateUuid(), authority: "municipality", reference: "BLD-2026-4471", requestedAt: ago(40), durationDays: 30, issuedAt: ago(25) },
        { uuid: generateUuid(), authority: "traffic", reference: "TRF-88120", requestedAt: ago(20), durationDays: 60, issuedAt: ago(10) },
        { uuid: generateUuid(), authority: "mot", reference: "MOT-55190", requestedAt: ago(8), durationDays: 90 },
      ],
      labTests: [
        { uuid: generateUuid(), lab: "municipal", subject: "civil_works", status: "passed", testedAt: ago(9) },
        { uuid: generateUuid(), lab: "mobily", subject: "civil_works", status: "pending" },
      ],
    }),
  };

  // MOB-002 — in Certificates. RFS and PAC received; FAC opens 365 days after
  // PAC, which is 15 days from now (rule 6 + alert). Final clearance is due two
  // years after Stage 2 (rule 9).
  const allMobilyUpToPac = {
    site_survey: step(560),
    design_package: step(555),
    pr_requested: step(550),
    po_received: step(545),
    materials_delivered: step(538, "warehouse_keeper"),
    equipment_ready: step(537),
    manpower_ready: step(537),
    trench_excavation: step(520, "project_engineer"),
    pipe_laying: step(510, "project_engineer"),
    mh_installation: step(505, "project_engineer"),
    concrete_backfilling: step(500, "project_engineer"),
    concrete_samples: step(500, "project_engineer"),
    milling_paving: step(495, "project_engineer"),
    cable_pulling_splicing: step(488, "project_engineer"),
    pat_submitted: step(480),
    mandrel_test: step(470, "project_engineer"),
    foc_e2e_test: step(468, "project_engineer"),
    otdr_test: step(468, "project_engineer"),
    oil_sheet_signed: step(465),
    completion_certificate: step(455),
    party_clearance: step(430),
    remedy_requested: step(462),
    remedy_approved: step(450),
    pcr_requested: step(445),
    sdn_approved: step(440),
    as_built_submitted: step(438),
    rfs_submitted: step(430),
    rfs_received: step(410),
    pac_submitted: step(380),
    pac_received: step(350),
  };

  const mob2: Project = {
    uuid: generateUuid(),
    code: "MOB-002",
    name: "Al-Malqa ring closure",
    operator: "mobily",
    region: "central",
    city: "Riyadh",
    siteName: "RUH-MLQ-042",
    poNumber: "MOB-PO-70033",
    poValue: 850000,
    projectManagerName: nameOf("project_manager"),
    createdAt: ago(565),
    mobily: mobily({
      steps: allMobilyUpToPac,
      permits: [
        { uuid: generateUuid(), authority: "municipality", reference: "BLD-2025-1180", requestedAt: ago(536), durationDays: 60, issuedAt: ago(530) },
      ],
      labTests: [
        { uuid: generateUuid(), lab: "municipal", subject: "civil_works", status: "passed", testedAt: ago(503) },
        { uuid: generateUuid(), lab: "mobily", subject: "civil_works", status: "passed", testedAt: ago(502) },
        { uuid: generateUuid(), lab: "municipal", subject: "milling_paving", status: "passed", testedAt: ago(494) },
      ],
    }),
  };

  // MOB-003 — just in from the design department.
  const mob3: Project = {
    uuid: generateUuid(),
    code: "MOB-003",
    name: "King Fahd Rd duct route",
    operator: "mobily",
    region: "western",
    city: "Jeddah",
    siteName: "JED-KFR-009",
    poValue: 420000,
    projectManagerName: nameOf("project_manager"),
    createdAt: ago(6),
    mobily: mobily({ steps: { site_survey: step(3) } }),
  };

  // ─── STC projects ────────────────────────────────────────────────────────

  const doc = (
    key: StcDocumentKey,
    uploadedDaysAgo: number | null,
    approvedBy: StcParty[] = [],
  ): StcDocument => ({
    key,
    uploadedAt: uploadedDaysAgo === null ? undefined : ago(uploadedDaysAgo),
    fileName: uploadedDaysAgo === null ? undefined : `${key}.pdf`,
    approvals: approvedBy.map((party) => ({
      party,
      decision: "approved",
      at: ago(Math.max(0, (uploadedDaysAgo ?? 0) - 1)),
      by: nameOf("project_manager"),
    })),
  });

  const stc = (workflow: Partial<StcWorkflow>): StcWorkflow => ({
    stage: "design",
    patSteps: {},
    m3Checks: {},
    milestone: { qtyIncreased: false, newUpl: false, status: "open" },
    documents: [],
    stageHistory: [],
    ...workflow,
  });

  // STC-001 — Design End Date 10 hours ago: 14 hours left on the countdown (rule 1).
  const stc1: Project = {
    uuid: generateUuid(),
    code: "STC-001",
    name: "Hittin FTTH cabinet",
    operator: "stc",
    region: "central",
    city: "Riyadh",
    siteName: "STC-RUH-HTN-21",
    poNumber: "STC-PO-310045",
    poValue: 310000,
    projectManagerName: nameOf("project_manager"),
    createdAt: ago(12),
    stc: stc({
      stage: "design",
      designClosedAt: ago(1),
      designEndDate: addHours(now, -10),
    }),
  };

  // STC-004 — in M2: Permit Application approved, Permit Receipt still pending,
  // Baladiyah not uploaded — so no End Date yet (rules 2, 3).
  const stc4: Project = {
    uuid: generateUuid(),
    code: "STC-004",
    name: "Al-Nakheel duct crossing",
    operator: "stc",
    region: "central",
    city: "Riyadh",
    siteName: "STC-RUH-NKL-07",
    poNumber: "STC-PO-310112",
    poValue: 190000,
    projectManagerName: nameOf("project_manager"),
    createdAt: ago(25),
    stc: stc({
      stage: "m2",
      designClosedAt: ago(20),
      designEndDate: ago(19),
      documents: [
        doc("permit_application", 10, ["stc"]),
        doc("permit_receipt", 4),
        doc("baladiyah", null),
      ],
      stageHistory: [{ stage: "m2", at: ago(18), by: nameOf("project_manager") }],
    }),
  };

  // STC-002 — in M3. PAT half done; RFS documents partly approved; the
  // Milestone has an increased quantity and no C09 yet (rule 6 warning).
  const stc2: Project = {
    uuid: generateUuid(),
    code: "STC-002",
    name: "Exit 15 backbone",
    operator: "stc",
    region: "central",
    city: "Riyadh",
    siteName: "STC-RUH-E15-03",
    poNumber: "STC-PO-309877",
    poValue: 560000,
    projectManagerName: nameOf("project_manager"),
    createdAt: ago(80),
    stc: stc({
      stage: "m3",
      designClosedAt: ago(75),
      designEndDate: ago(74),
      m2EndDate: ago(50),
      sentToSupervisorAt: ago(49),
      inspectorName: "Eng. Fahad Al-Rashid",
      inspectorAssignedAt: ago(47),
      patSteps: { gt_uploaded_ne: step(20), npts_requested: step(15) },
      m3Checks: { milestones_updated: step(14) },
      milestone: { qtyIncreased: true, newUpl: false, status: "open" },
      documents: [
        doc("permit_application", 55, ["stc"]),
        doc("permit_receipt", 52, ["stc"]),
        doc("baladiyah", 30),
        doc("budget_calculator", 6, ["inspector", "supervisor"]),
        doc("odf_tb_power_meter", 5, ["inspector"]),
        doc("otdr_splice_average", 3),
        doc("material_form", null),
        doc("ftr", null),
        doc("as_built", null),
        doc("c09", null),
      ],
      stageHistory: [
        { stage: "m2", at: ago(73), by: nameOf("project_manager") },
        { stage: "m3", at: ago(46), by: nameOf("project_manager") },
      ],
    }),
  };

  // STC-003 — every stage approved: the only site on STC's dashboard (rule 8).
  const stc3: Project = {
    uuid: generateUuid(),
    code: "STC-003",
    name: "Diplomatic Quarter FTTx",
    operator: "stc",
    region: "central",
    city: "Riyadh",
    siteName: "STC-RUH-DQ-11",
    poNumber: "STC-PO-305210",
    poValue: 470000,
    projectManagerName: nameOf("project_manager"),
    createdAt: ago(160),
    stc: stc({
      stage: "completed",
      designClosedAt: ago(155),
      designEndDate: ago(154),
      m2EndDate: ago(130),
      sentToSupervisorAt: ago(129),
      inspectorName: "Eng. Salem Al-Omari",
      inspectorAssignedAt: ago(128),
      patSteps: {
        gt_uploaded_ne: step(90),
        npts_requested: step(88),
        plate_marking: step(85),
        pat_scheduled: step(80),
        pat_completed: step(72),
      },
      m3Checks: { milestones_updated: step(95), traces: step(94), power_picture: step(94) },
      m3EndDate: ago(78),
      milestone: {
        qtyIncreased: false,
        newUpl: false,
        status: "closed",
        inspectorApprovedAt: ago(77),
        supervisorApprovedAt: ago(76),
        closedAt: ago(76),
      },
      documents: [
        doc("permit_application", 135, ["stc"]),
        doc("permit_receipt", 133, ["stc"]),
        doc("baladiyah", 120, ["stc"]),
        doc("budget_calculator", 82, ["inspector", "supervisor"]),
        doc("odf_tb_power_meter", 82, ["inspector", "supervisor"]),
        doc("otdr_splice_average", 82, ["inspector", "supervisor"]),
        doc("material_form", 82, ["inspector", "supervisor"]),
        doc("ftr", 82, ["inspector", "supervisor"]),
        doc("as_built", 80, ["inspector", "supervisor"]),
        doc("m4_document", 65, ["supervisor"]),
        doc("ho_screenshot", 65, ["supervisor"]),
        doc("m5_acceptance", 40, ["stc_qc", "project_manager"]),
      ],
      dashboardAt: ago(38),
      stageHistory: [
        { stage: "m2", at: ago(153), by: nameOf("project_manager") },
        { stage: "m3", at: ago(127), by: nameOf("project_manager") },
        { stage: "m4", at: ago(70), by: nameOf("project_manager") },
        { stage: "m5", at: ago(60), by: nameOf("project_manager") },
        { stage: "completed", at: ago(38), by: nameOf("project_manager") },
      ],
    }),
  };

  store.Projects = [mob1, mob2, mob3, stc1, stc2, stc3, stc4];

  // ─── Portal accounts ─────────────────────────────────────────────────────

  store.PortalAccounts = [
    { uuid: generateUuid(), name: "Mobily — Central region", email: "projects@mobily.example", kind: "customer", operator: "mobily" },
    { uuid: generateUuid(), name: "STC — Riyadh FTTx", email: "fttx@stc.example", kind: "customer", operator: "stc" },
    { uuid: generateUuid(), name: albina.name, email: albina.email, kind: "subcontractor", subcontractorUuid: albina.uuid },
    { uuid: generateUuid(), name: fiberLink.name, email: fiberLink.email, kind: "subcontractor", subcontractorUuid: fiberLink.uuid },
  ];

  // ─── Budgets ─────────────────────────────────────────────────────────────

  const budget = (project: Project, approved: boolean, lines: [BudgetCategory, number][]) => ({
    uuid: generateUuid(),
    projectUuid: project.uuid,
    status: approved ? ("approved" as const) : ("draft" as const),
    lines: lines.map(([category, planned]) => ({ category, planned })),
    approvedAt: approved ? addDays(project.createdAt, 2) : undefined,
    approvedBy: approved ? nameOf("projects_manager") : undefined,
    revisions: [],
  });


  store.ProjectBudgets = [
    budget(mob1, true, [["civil_works", 260000], ["fiber_works", 60000], ["fiber_materials", 70000], ["civil_materials", 45000], ["equipment", 25000], ["manpower", 60000], ["permits", 12000], ["overhead", 18000]]),
    budget(mob2, true, [["civil_works", 300000], ["fiber_works", 90000], ["fiber_materials", 110000], ["civil_materials", 60000], ["manpower", 80000], ["permits", 15000], ["overhead", 25000]]),
    budget(mob3, false, [["civil_works", 150000], ["fiber_materials", 50000], ["civil_materials", 40000], ["manpower", 40000], ["permits", 10000]]),
    budget(stc1, true, [["civil_works", 90000], ["fiber_works", 50000], ["fiber_materials", 40000], ["manpower", 30000], ["permits", 8000]]),
    budget(stc2, true, [["civil_works", 150000], ["fiber_works", 180000], ["fiber_materials", 60000], ["civil_materials", 40000], ["manpower", 50000], ["permits", 10000], ["overhead", 15000]]),
    budget(stc3, true, [["civil_works", 140000], ["fiber_works", 110000], ["fiber_materials", 55000], ["manpower", 45000], ["permits", 9000]]),
    budget(stc4, true, [["civil_works", 70000], ["fiber_works", 30000], ["civil_materials", 20000], ["permits", 6000]]),
  ];

  // ─── Procurement ─────────────────────────────────────────────────────────

  const totals = (lines: PricedLine[]) => {
    const subtotal = round2(lines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0));
    const vat = round2(subtotal * VAT);
    return { subtotal, vat, total: round2(subtotal + vat) };
  };

  // PR-0001 — waiting for the direct manager.
  const pr1 = {
    uuid: generateUuid(),
    number: "PR-0001",
    projectUuid: mob1.uuid,
    department: "Projects — Central",
    budgetCategory: "fiber_materials" as const,
    requestedBy: nameOf("project_manager"),
    lines: [{ itemUuid: fiber96.uuid, qty: 3000, estUnitPrice: 6.8, expectedDate: ahead(14) }],
    status: "pending_manager" as const,
    approvals: [],
    quoteApprovals: [],
    note: "96F cable below reorder level for the Olaya extension.",
    createdAt: ago(1),
  };

  // PR-0002 — collecting quotations: two received, a third needed (or a
  // previously approved one).
  const pr2 = {
    uuid: generateUuid(),
    number: "PR-0002",
    projectUuid: stc2.uuid,
    department: "Projects — Central",
    budgetCategory: "civil_materials" as const,
    requestedBy: nameOf("project_manager"),
    lines: [
      { itemUuid: manhole.uuid, qty: 12, estUnitPrice: 1450, expectedDate: ahead(10) },
      { itemUuid: duct.uuid, qty: 2500, estUnitPrice: 3.1, expectedDate: ahead(10) },
    ],
    status: "rfq" as const,
    approvals: approvals(["direct_manager"], 6),
    quoteApprovals: [],
    stockAvailable: false,
    createdAt: ago(7),
  };

  // PR-0003 → PO-0001 — ordered, sent 20 days ago with a 14-day delivery:
  // six days late (alert), partially received.
  const q3Lines: PricedLine[] = [
    { itemUuid: duct.uuid, qty: 1000, unitPrice: 2.95 },
    { itemUuid: closure.uuid, qty: 40, unitPrice: 172 },
  ];
  const pr3 = {
    uuid: generateUuid(),
    number: "PR-0003",
    projectUuid: mob1.uuid,
    department: "Projects — Central",
    budgetCategory: "civil_materials" as const,
    requestedBy: nameOf("project_manager"),
    lines: [
      { itemUuid: duct.uuid, qty: 1000, estUnitPrice: 3.1, expectedDate: ago(10) },
      { itemUuid: closure.uuid, qty: 40, estUnitPrice: 180, expectedDate: ago(10) },
    ],
    status: "ordered" as const,
    approvals: approvals(["direct_manager"], 34),
    quoteApprovals: approvals(PURCHASE_CHAIN, 26),
    stockAvailable: false,
    createdAt: ago(35),
  };

  const quotation = (
    number: string,
    prUuid: string,
    supplierUuid: string,
    lines: PricedLine[],
    deliveryDays: number,
    paymentTermsDays: number,
    qualityScore: number,
    daysAgo: number,
  ) => ({
    uuid: generateUuid(),
    number,
    prUuid,
    supplierUuid,
    lines,
    deliveryDays,
    paymentTermsDays,
    qualityScore,
    previouslyApproved: false,
    requestedByEmailAt: ago(daysAgo + 2),
    receivedAt: ago(daysAgo),
  });

  const q1 = quotation("RFQ-0001", pr2.uuid, najdCivil.uuid, [{ itemUuid: manhole.uuid, qty: 12, unitPrice: 1390 }, { itemUuid: duct.uuid, qty: 2500, unitPrice: 3.05 }], 10, 30, 4, 4);
  const q2 = quotation("RFQ-0002", pr2.uuid, gulfFiber.uuid, [{ itemUuid: manhole.uuid, qty: 12, unitPrice: 1475 }, { itemUuid: duct.uuid, qty: 2500, unitPrice: 2.9 }], 7, 45, 3, 3);
  const q3a = quotation("RFQ-0003", pr3.uuid, arabCables.uuid, q3Lines, 14, 30, 4, 30);
  const q3b = quotation("RFQ-0004", pr3.uuid, gulfFiber.uuid, [{ itemUuid: duct.uuid, qty: 1000, unitPrice: 3.2 }, { itemUuid: closure.uuid, qty: 40, unitPrice: 169 }], 10, 30, 3, 30);
  const q3c = quotation("RFQ-0005", pr3.uuid, eastTech.uuid, [{ itemUuid: duct.uuid, qty: 1000, unitPrice: 3.0 }, { itemUuid: closure.uuid, qty: 40, unitPrice: 190 }], 21, 60, 4, 29);
  store.Quotations = [q1, q2, q3a, q3b, q3c];
  store.PurchaseRequests = [pr1, pr2, { ...pr3, selectedQuotationUuid: q3a.uuid }];

  const po1Totals = totals(q3Lines);
  const po1 = {
    uuid: generateUuid(),
    number: "PO-0001",
    prUuid: pr3.uuid,
    quotationUuid: q3a.uuid,
    supplierUuid: arabCables.uuid,
    projectUuid: mob1.uuid,
    budgetCategory: "civil_materials" as const,
    lines: q3Lines,
    ...po1Totals,
    deliveryDays: 14,
    paymentTermsDays: 30,
    status: "partially_received" as const,
    approvals: approvals(PURCHASE_CHAIN, 22),
    sentAt: ago(20),
    expectedDeliveryAt: ago(6),
    advancePaid: 1000,
    amendments: [],
    createdAt: ago(25),
  };
  store.PurchaseOrders = [po1];

  const grn1 = {
    uuid: generateUuid(),
    number: "GRN-0001",
    poUuid: po1.uuid,
    warehouseUuid: ruh.uuid,
    receivedAt: ago(4),
    receivedBy: nameOf("warehouse_keeper"),
    lines: [
      { itemUuid: duct.uuid, receivedQty: 600, acceptedQty: 580, rejectionReason: "20 m crushed in transit" },
      { itemUuid: closure.uuid, receivedQty: 40, acceptedQty: 40 },
    ],
  };
  store.GoodsReceipts = [grn1];
  store.StockMovements.push(
    ...grn1.lines.map((line) => {
      const poLine = q3Lines.find((l) => l.itemUuid === line.itemUuid);
      return {
        uuid: generateUuid(),
        type: "receipt" as const,
        itemUuid: line.itemUuid,
        warehouseUuid: ruh.uuid,
        qty: line.acceptedQty,
        unitCost: poLine ? poLine.unitPrice : 0,
        refKind: "goods_receipt" as const,
        refUuid: grn1.uuid,
        refNumber: grn1.number,
        projectUuid: mob1.uuid,
        at: grn1.receivedAt,
        by: grn1.receivedBy,
      };
    }),
  );

  // AP-0001 — the supplier's invoice for what GRN-0001 accepted, registered and
  // matched, waiting for approval. The PO's advance is recovered from it.
  const ap1Subtotal = round2(580 * 2.95 + 40 * 172);
  const ap1Vat = round2(ap1Subtotal * VAT);
  store.SupplierInvoices = [
    {
      uuid: generateUuid(),
      number: "AP-0001",
      supplierUuid: arabCables.uuid,
      invoiceNumber: "AC-INV-20931",
      invoiceDate: ago(3),
      poUuid: po1.uuid,
      grnUuids: [grn1.uuid],
      subtotal: ap1Subtotal,
      vat: ap1Vat,
      total: round2(ap1Subtotal + ap1Vat),
      advanceDeducted: 1000,
      netPayable: round2(ap1Subtotal + ap1Vat - 1000),
      dueDate: ahead(27),
      status: "registered",
      payments: [],
      registeredBy: nameOf("accountant"),
      createdAt: ago(2),
    },
  ];

  // ─── Warehouse operations ────────────────────────────────────────────────

  // IR-0001 — a splicing machine for the site engineer: a fixed asset, so it
  // becomes custody on the employee when issued. Waiting for the region PM.
  // IR-0002 — materials already issued to Al-Bina on MOB-001; their value comes
  // off Al-Bina's next extract.
  const ir1 = {
    uuid: generateUuid(),
    number: "IR-0001",
    projectUuid: mob1.uuid,
    warehouseUuid: ruh.uuid,
    requestedBy: nameOf("project_manager"),
    recipient: { kind: "employee" as const, name: nameOf("project_engineer") },
    lines: [{ itemUuid: splicer.uuid, qty: 1 }],
    inventoryFrequency: "monthly" as const,
    status: "pending_approval" as const,
    approvals: [],
  };
  const ir2 = {
    uuid: generateUuid(),
    number: "IR-0002",
    projectUuid: mob1.uuid,
    warehouseUuid: ruh.uuid,
    requestedBy: nameOf("project_manager"),
    recipient: { kind: "subcontractor" as const, name: albina.name, subcontractorUuid: albina.uuid },
    lines: [
      { itemUuid: duct.uuid, qty: 400 },
      { itemUuid: manhole.uuid, qty: 4 },
    ],
    status: "issued" as const,
    approvals: approvals(["region_project_manager"], 16),
    signedByRecipient: albina.name,
    signedByKeeper: nameOf("warehouse_keeper"),
    issuedAt: ago(15),
  };
  store.IssueRequests = [ir1, ir2];
  store.StockMovements.push(
    ...ir2.lines.map((line) => {
      const target = store.Items.find((i) => i.uuid === line.itemUuid);
      return {
        uuid: generateUuid(),
        type: "issue" as const,
        itemUuid: line.itemUuid,
        warehouseUuid: ruh.uuid,
        qty: -line.qty,
        unitCost: target ? target.standardCost : 0,
        refKind: "issue_request" as const,
        refUuid: ir2.uuid,
        refNumber: ir2.number,
        projectUuid: mob1.uuid,
        chargedTo: ir2.recipient,
        at: ago(15),
        by: nameOf("warehouse_keeper"),
      };
    }),
  );

  // An OTDR tester on weekly count, last counted 10 days ago: overdue.
  const irOtdr = {
    uuid: generateUuid(),
    number: "IR-0003",
    projectUuid: stc2.uuid,
    warehouseUuid: ruh.uuid,
    requestedBy: nameOf("project_manager"),
    recipient: { kind: "employee" as const, name: nameOf("project_engineer") },
    lines: [{ itemUuid: otdr.uuid, qty: 1 }],
    inventoryFrequency: "weekly" as const,
    status: "issued" as const,
    approvals: approvals(["region_project_manager"], 41),
    signedByRecipient: nameOf("project_engineer"),
    signedByKeeper: nameOf("warehouse_keeper"),
    issuedAt: ago(40),
  };
  store.IssueRequests.push(irOtdr);
  store.StockMovements.push({
    uuid: generateUuid(),
    type: "issue",
    itemUuid: otdr.uuid,
    warehouseUuid: ruh.uuid,
    qty: -1,
    unitCost: otdr.standardCost,
    refKind: "issue_request",
    refUuid: irOtdr.uuid,
    refNumber: irOtdr.number,
    projectUuid: stc2.uuid,
    chargedTo: irOtdr.recipient,
    at: ago(40),
    by: nameOf("warehouse_keeper"),
  });
  store.AssetCustodies = [
    {
      uuid: generateUuid(),
      itemUuid: otdr.uuid,
      qty: 1,
      employeeName: nameOf("project_engineer"),
      issueRequestUuid: irOtdr.uuid,
      projectUuid: stc2.uuid,
      inventoryFrequency: "weekly",
      issuedAt: ago(40),
      lastCountedAt: ago(10),
      status: "with_employee",
    },
  ];

  // ─── Cash custody ────────────────────────────────────────────────────────

  // CC-0001 — disbursed and open: the project manager cannot take another on
  // MOB-001 until it is settled, and cannot be cleared either.
  // CC-0002 — two of six approvals in.
  store.CashCustodies = [
    {
      uuid: generateUuid(),
      number: "CC-0001",
      employeeName: nameOf("project_manager"),
      projectUuid: mob1.uuid,
      budgetCategory: "overhead",
      city: "Riyadh",
      workOrderNo: "WO-11820",
      amount: 5000,
      lines: [
        { description: "Site water and ice", amount: 1200 },
        { description: "Traffic signage rental", amount: 2300 },
        { description: "Fuel for site generator", amount: 1500 },
      ],
      status: "disbursed",
      approvals: approvals(["region_accountant", "region_project_manager", "projects_manager", "finance_manager", "operations_manager", "deputy_gm"], 18),
      disbursedAt: ago(15),
      receiptSignedAt: ago(15),
      createdAt: ago(19),
    },
    {
      uuid: generateUuid(),
      number: "CC-0002",
      employeeName: nameOf("project_engineer"),
      projectUuid: stc2.uuid,
      budgetCategory: "permits",
      city: "Riyadh",
      workOrderNo: "WO-11904",
      amount: 3500,
      lines: [{ description: "Baladiyah permit fees", amount: 3500 }],
      status: "pending_approval",
      approvals: approvals(["region_accountant", "region_project_manager"], 2),
      createdAt: ago(3),
    },
  ];

  // ─── Subcontractors ──────────────────────────────────────────────────────

  const sc1 = {
    uuid: generateUuid(),
    number: "SC-0001",
    subcontractorUuid: albina.uuid,
    projectUuid: mob1.uuid,
    scope: "Civil works — trenching, ducts, manholes, reinstatement",
    budgetCategory: "civil_works" as const,
    value: 250000,
    retentionPct: 10,
    advancePaid: 25000,
    createdAt: ago(55),
  };
  const sc2 = {
    uuid: generateUuid(),
    number: "SC-0002",
    subcontractorUuid: fiberLink.uuid,
    projectUuid: stc2.uuid,
    scope: "Fiber works — pulling, splicing, testing",
    budgetCategory: "fiber_works" as const,
    value: 180000,
    retentionPct: 5,
    advancePaid: 0,
    createdAt: ago(45),
  };
  store.Subcontracts = [sc1, sc2];

  // EX-0001 — approved before IR-0002, so no materials came off it.
  // EX-0002 — submitted from the portal; IR-0002's materials come off this one.
  store.Extracts = [
    {
      uuid: generateUuid(),
      number: "EX-0001",
      subcontractUuid: sc1.uuid,
      periodFrom: ago(50),
      periodTo: ago(20),
      lines: [
        { description: "Trench excavation", unit: "m", qty: 1200, unitRate: 35 },
        { description: "Duct laying", unit: "m", qty: 1200, unitRate: 15 },
      ],
      gross: 60000,
      advanceDeduction: 6000,
      retention: 6000,
      penalties: 0,
      materialsDeduction: 0,
      net: 48000,
      status: "approved",
      approvals: approvals(["project_engineer", "projects_manager", "finance_manager"], 18),
      submittedVia: "admin",
      submittedBy: nameOf("project_engineer"),
      createdAt: ago(19),
    },
    {
      uuid: generateUuid(),
      number: "EX-0002",
      subcontractUuid: sc1.uuid,
      periodFrom: ago(20),
      periodTo: ago(2),
      lines: [
        { description: "MH installation", unit: "pcs", qty: 4, unitRate: 2500 },
        { description: "Duct laying", unit: "m", qty: 800, unitRate: 15 },
        { description: "Backfilling", unit: "m", qty: 800, unitRate: 12 },
      ],
      gross: 31600,
      advanceDeduction: 3160,
      retention: 3160,
      penalties: 0,
      materialsDeduction: round2(400 * duct.standardCost + 4 * manhole.standardCost),
      net: round2(31600 - 3160 - 3160 - (400 * duct.standardCost + 4 * manhole.standardCost)),
      status: "submitted",
      approvals: [],
      submittedVia: "portal",
      submittedBy: albina.name,
      createdAt: ago(1),
    },
  ];

  // ─── Customer invoices ───────────────────────────────────────────────────

  const customerInvoice = (
    number: string,
    project: Project,
    basis: "rfs" | "pac" | "fac" | "as_built",
    amount: number,
    submittedDaysAgo: number,
    paidDaysAgo?: number,
  ) => ({
    uuid: generateUuid(),
    number,
    projectUuid: project.uuid,
    basis,
    amount,
    vat: round2(amount * VAT),
    total: round2(amount * (1 + VAT)),
    submittedAt: ago(submittedDaysAgo),
    dueAt: addDays(ago(submittedDaysAgo), 60),
    paidAt: paidDaysAgo === undefined ? undefined : ago(paidDaysAgo),
    createdBy: nameOf("accountant"),
  });

  store.CustomerInvoices = [
    customerInvoice("CI-0001", mob2, "rfs", 595000, 405, 345),
    customerInvoice("CI-0002", mob2, "pac", 170000, 30),
    customerInvoice("CI-0003", stc3, "as_built", 470000, 70),
  ];

  // ─── Closing ─────────────────────────────────────────────────────────────

  const lastMonth = addDays(`${now.slice(0, 7)}-01T00:00:00.000Z`, -1).slice(0, 7);
  store.ClosingPeriods = [
    {
      uuid: generateUuid(),
      period: lastMonth,
      items: {
        bank_reconciliation: step(1, "accountant"),
        supplier_balances: step(1, "accountant"),
      },
    },
  ];

  addMoreDemoData(store, now);
  addExtraDemoData(store, now);

  store.Activity = [
    {
      uuid: generateUuid(),
      at: now,
      actorName: "System",
      entity: "system",
      entityUuid: "seed",
      entityLabel: "Demo data",
      action: "Demo data loaded",
    },
    ...deriveActivity(store),
  ];

  return store;
};
