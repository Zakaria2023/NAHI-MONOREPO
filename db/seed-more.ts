import { addDays, generateUuid, round2 } from "utils";
import { BudgetCategory, MobilyStep, StaffRole, StcDocumentKey, StcParty, mobilySteps } from "./enum";
import {
  Approval,
  CustomerInvoice,
  GoodsReceipt,
  Item,
  MobilyWorkflow,
  PricedLine,
  Project,
  ProjectBudget,
  PurchaseOrder,
  PurchaseRequest,
  Quotation,
  StcDocument,
  StcWorkflow,
  StepRecord,
  StockMovement,
  Store,
  Supplier,
  Warehouse,
} from "./types";

// MORE DEMO DATA, so every screen of the MVP has something in each of its
// states: projects at every stage, documents waiting at every step of every
// chain, and finished ones beside them. Added on top of seed.ts's core set,
// which the tests rely on — nothing here changes a record defined there.

type QuoteSpec = {
  supplier: Supplier;
  /** Multiplier on the PR's estimated prices. */
  priceFactor: number;
  deliveryDays: number;
  paymentTermsDays: number;
  qualityScore: number;
};

type PurchaseSpec = {
  number: string;
  project: Project;
  category: BudgetCategory;
  lines: [Item, number, number][];
  createdDaysAgo: number;
  note?: string;
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

const TRANSFER_CHAIN: StaffRole[] = [
  "warehouse_keeper",
  "region_accountant",
  "region_project_manager",
  "projects_manager",
  "operations_manager",
];

const CASH_CHAIN: StaffRole[] = [
  "region_accountant",
  "region_project_manager",
  "projects_manager",
  "finance_manager",
  "operations_manager",
  "deputy_gm",
];

const RFS_DOCS: StcDocumentKey[] = ["budget_calculator", "odf_tb_power_meter", "otdr_splice_average", "material_form", "ftr"];

export const addMoreDemoData = (store: Store, now: string): void => {
  const ago = (days: number): string => addDays(now, -days);
  const ahead = (days: number): string => addDays(now, days);

  const find = <T,>(rows: T[], match: (row: T) => boolean, what: string): T => {
    const row = rows.find(match);
    if (!row) {
      throw new Error(`Seed: ${what} not found`);
    }
    return row;
  };
  const nameOf = (role: StaffRole): string => find(store.StaffUsers, (u) => u.role === role, role).name;
  const item = (code: string): Item => find(store.Items, (i) => i.code === code, code);
  const warehouse = (code: string): Warehouse => find(store.Warehouses, (w) => w.code === code, code);
  const supplier = (name: string): Supplier => find(store.Suppliers, (s) => s.name === name, name);
  const subcontractor = (name: string) => find(store.Subcontractors, (s) => s.name === name, name);

  const step = (daysAgo: number, role: StaffRole = "project_manager"): StepRecord => ({ at: ago(daysAgo), by: nameOf(role) });
  const approvals = (roles: StaffRole[], daysAgo: number): Approval[] =>
    roles.map((role, index) => ({ role, decision: "approved", actorName: nameOf(role), at: ago(daysAgo - index * 0.3) }));

  const move = (input: Omit<StockMovement, "uuid" | "by"> & { by?: string }): void => {
    store.StockMovements.push({ uuid: generateUuid(), by: input.by ?? nameOf("warehouse_keeper"), ...input });
  };

  // ─── More projects ───────────────────────────────────────────────────────

  /** Every Mobily step up to `last` (in the cycle's order), dated evenly from `fromDays` to `toDays` ago. */
  const mobilyStepsUpTo = (last: MobilyStep, fromDays: number, toDays: number): MobilyWorkflow["steps"] => {
    const order: MobilyStep[] = mobilySteps.filter((s) => s !== "final_clearance");
    const list = order.slice(0, order.indexOf(last) + 1);
    const span = fromDays - toDays;
    return Object.fromEntries(
      list.map((s, index) => [
        s,
        step(Math.round(fromDays - (span * index) / Math.max(1, list.length - 1)), s.includes("test") || s.includes("pipe") || s.includes("trench") ? "project_engineer" : "project_manager"),
      ]),
    );
  };

  const passedLabs = (daysAgo: number): MobilyWorkflow["labTests"] => [
    { uuid: generateUuid(), lab: "municipal", subject: "civil_works", status: "passed", testedAt: ago(daysAgo) },
    { uuid: generateUuid(), lab: "mobily", subject: "civil_works", status: "passed", testedAt: ago(daysAgo - 1) },
    { uuid: generateUuid(), lab: "municipal", subject: "milling_paving", status: "passed", testedAt: ago(daysAgo - 3) },
  ];

  const project = (fields: Omit<Project, "uuid" | "projectManagerName">): Project => ({
    uuid: generateUuid(),
    projectManagerName: nameOf("project_manager"),
    ...fields,
  });

  // MOB-004 — Site HO: the mandrel test is done, FOC and OTDR are next; Remedy
  // Approval stays locked until the Oil Sheet is signed (rule 4).
  const mob4 = project({
    code: "MOB-004",
    name: "Al-Yasmin backbone",
    operator: "mobily",
    region: "central",
    city: "Riyadh",
    siteName: "RUH-YSM-205",
    poNumber: "MOB-PO-78150",
    poValue: 720000,
    createdAt: ago(130),
    mobily: {
      steps: { ...mobilyStepsUpTo("pat_submitted", 125, 9), mandrel_test: step(4, "project_engineer") },
      permits: [
        { uuid: generateUuid(), authority: "municipality", reference: "BLD-2026-3392", requestedAt: ago(112), durationDays: 120, issuedAt: ago(104) },
        { uuid: generateUuid(), authority: "traffic", reference: "TRF-80412", requestedAt: ago(110), durationDays: 90, issuedAt: ago(100) },
      ],
      labTests: passedLabs(30),
    },
  });

  // MOB-005 — PCR & SDN, in the Eastern region.
  const mob5 = project({
    code: "MOB-005",
    name: "Dammam port link",
    operator: "mobily",
    region: "eastern",
    city: "Dammam",
    siteName: "DMM-PRT-031",
    poNumber: "MOB-PO-76604",
    poValue: 980000,
    createdAt: ago(240),
    mobily: {
      steps: mobilyStepsUpTo("pcr_requested", 235, 6),
      permits: [{ uuid: generateUuid(), authority: "municipality", reference: "DMM-BLD-5521", requestedAt: ago(205), durationDays: 150, issuedAt: ago(198) }],
      labTests: passedLabs(120),
    },
  });

  // MOB-006 — the whole cycle done and the PO closed. Final Clearance falls due
  // in 30 days (two years after Party Clearance, rule 9).
  const mob6Steps = mobilyStepsUpTo("pac_received", 840, 420);
  const mob6 = project({
    code: "MOB-006",
    name: "Buraydah rural route",
    operator: "mobily",
    region: "central",
    city: "Buraydah",
    siteName: "QSM-BRD-014",
    poNumber: "MOB-PO-61027",
    poValue: 520000,
    createdAt: ago(845),
    mobily: {
      steps: {
        ...mob6Steps,
        party_clearance: step(700),
        fac_submitted: step(50),
        fac_received: step(32),
        po_closure_submitted: step(20),
        po_closed: step(9),
      },
      permits: [{ uuid: generateUuid(), authority: "municipality", reference: "QSM-BLD-0912", requestedAt: ago(820), durationDays: 90, issuedAt: ago(812) }],
      labTests: passedLabs(780),
    },
  });

  const doc = (key: StcDocumentKey, uploadedDaysAgo: number, approvedBy: StcParty[] = []): StcDocument => ({
    key,
    uploadedAt: ago(uploadedDaysAgo),
    fileName: `${key}.pdf`,
    approvals: approvedBy.map((party) => ({ party, decision: "approved", at: ago(Math.max(0, uploadedDaysAgo - 1)), by: nameOf("project_manager") })),
  });

  const stcThroughM3 = (startDays: number): Omit<StcWorkflow, "stage" | "stageHistory"> => ({
    designClosedAt: ago(startDays),
    designEndDate: ago(startDays - 1),
    m2EndDate: ago(startDays - 20),
    sentToSupervisorAt: ago(startDays - 21),
    inspectorName: "Eng. Nawaf Al-Harthi",
    inspectorAssignedAt: ago(startDays - 22),
    patSteps: {
      gt_uploaded_ne: step(startDays - 40),
      npts_requested: step(startDays - 42),
      plate_marking: step(startDays - 45),
      pat_scheduled: step(startDays - 48),
      pat_completed: step(startDays - 52),
    },
    m3Checks: { milestones_updated: step(startDays - 35), traces: step(startDays - 36), power_picture: step(startDays - 36) },
    m3EndDate: ago(startDays - 50),
    milestone: {
      qtyIncreased: false,
      newUpl: false,
      status: "closed",
      inspectorApprovedAt: ago(startDays - 51),
      supervisorApprovedAt: ago(startDays - 51),
      closedAt: ago(startDays - 51),
    },
    documents: [
      doc("permit_application", startDays - 5, ["stc"]),
      doc("permit_receipt", startDays - 8, ["stc"]),
      doc("baladiyah", startDays - 15, ["stc"]),
      ...RFS_DOCS.map((key) => doc(key, startDays - 49, ["inspector", "supervisor"])),
      doc("as_built", startDays - 50, ["inspector", "supervisor"]),
    ],
  });

  // STC-005 — M4: the M4 document and the HO screenshot are with the Supervisor.
  const stc5Base = stcThroughM3(95);
  const stc5 = project({
    code: "STC-005",
    name: "Al-Sahafa FTTH phase 2",
    operator: "stc",
    region: "central",
    city: "Riyadh",
    siteName: "STC-RUH-SHF-02",
    poNumber: "STC-PO-311208",
    poValue: 410000,
    createdAt: ago(100),
    stc: {
      ...stc5Base,
      stage: "m4",
      documents: [...stc5Base.documents, doc("m4_document", 3), doc("ho_screenshot", 2)],
      stageHistory: [
        { stage: "m2", at: ago(93), by: nameOf("project_manager") },
        { stage: "m3", at: ago(72), by: nameOf("project_manager") },
        { stage: "m4", at: ago(42), by: nameOf("project_manager") },
      ],
    },
  });

  // STC-006 — M5: STC QC has accepted, the PM's approval is the last one left.
  const stc6Base = stcThroughM3(140);
  const stc6 = project({
    code: "STC-006",
    name: "King Abdullah Rd duct",
    operator: "stc",
    region: "central",
    city: "Riyadh",
    siteName: "STC-RUH-KAR-09",
    poNumber: "STC-PO-307755",
    poValue: 380000,
    createdAt: ago(145),
    stc: {
      ...stc6Base,
      stage: "m5",
      documents: [
        ...stc6Base.documents,
        doc("m4_document", 70, ["supervisor"]),
        doc("ho_screenshot", 70, ["supervisor"]),
        doc("m5_acceptance", 6, ["stc_qc"]),
      ],
      stageHistory: [
        { stage: "m2", at: ago(138), by: nameOf("project_manager") },
        { stage: "m3", at: ago(117), by: nameOf("project_manager") },
        { stage: "m4", at: ago(86), by: nameOf("project_manager") },
        { stage: "m5", at: ago(60), by: nameOf("project_manager") },
      ],
    },
  });

  store.Projects.push(mob4, mob5, mob6, stc5, stc6);

  const budget = (p: Project, lines: [BudgetCategory, number][]): ProjectBudget => ({
    uuid: generateUuid(),
    projectUuid: p.uuid,
    status: "approved",
    lines: lines.map(([category, planned]) => ({ category, planned })),
    approvedAt: addDays(p.createdAt, 2),
    approvedBy: nameOf("projects_manager"),
    revisions: [],
  });
  store.ProjectBudgets.push(
    budget(mob4, [["civil_works", 280000], ["fiber_works", 90000], ["fiber_materials", 90000], ["civil_materials", 60000], ["manpower", 70000], ["permits", 14000], ["overhead", 20000]]),
    budget(mob5, [["civil_works", 360000], ["fiber_works", 120000], ["fiber_materials", 110000], ["civil_materials", 70000], ["manpower", 90000], ["permits", 16000], ["overhead", 25000]]),
    budget(mob6, [["civil_works", 190000], ["fiber_works", 70000], ["fiber_materials", 60000], ["civil_materials", 40000], ["manpower", 50000], ["permits", 9000]]),
    budget(stc5, [["civil_works", 120000], ["fiber_works", 90000], ["fiber_materials", 70000], ["manpower", 40000], ["permits", 8000]]),
    budget(stc6, [["civil_works", 110000], ["fiber_works", 80000], ["fiber_materials", 45000], ["manpower", 35000], ["permits", 7000]]),
  );

  // A revision on an approved budget, with its reason (finance §4 controls).
  const mob1 = find(store.Projects, (p) => p.code === "MOB-001", "MOB-001");
  const mob1Budget = find(store.ProjectBudgets, (b) => b.projectUuid === mob1.uuid, "MOB-001 budget");
  mob1Budget.revisions.push({
    at: ago(20),
    by: nameOf("projects_manager"),
    reason: "Route deviation of 200 m approved by Mobily — extra civil works",
    changes: [{ category: "civil_works", from: 240000, to: 260000 }],
  });

  // ─── Procurement: a request at every step ────────────────────────────────

  const prOf = (spec: PurchaseSpec, status: PurchaseRequest["status"], prApprovals: Approval[], extra: Partial<PurchaseRequest> = {}): PurchaseRequest => ({
    uuid: generateUuid(),
    number: spec.number,
    projectUuid: spec.project.uuid,
    department: `Projects — ${spec.project.city}`,
    budgetCategory: spec.category,
    requestedBy: nameOf("project_manager"),
    lines: spec.lines.map(([target, qty, est]) => ({ itemUuid: target.uuid, qty, estUnitPrice: est, expectedDate: ahead(14) })),
    status,
    approvals: prApprovals,
    quoteApprovals: [],
    note: spec.note,
    createdAt: ago(spec.createdDaysAgo),
    ...extra,
  });

  let rfqCount = store.Quotations.length;
  const quotesFor = (pr: PurchaseRequest, specs: QuoteSpec[], daysAgo: number): Quotation[] =>
    specs.map((q) => {
      rfqCount += 1;
      return {
        uuid: generateUuid(),
        number: `RFQ-${String(rfqCount).padStart(4, "0")}`,
        prUuid: pr.uuid,
        supplierUuid: q.supplier.uuid,
        lines: pr.lines.map((l) => ({ itemUuid: l.itemUuid, qty: l.qty, unitPrice: round2(l.estUnitPrice * q.priceFactor) })),
        deliveryDays: q.deliveryDays,
        paymentTermsDays: q.paymentTermsDays,
        qualityScore: q.qualityScore,
        previouslyApproved: false,
        requestedByEmailAt: ago(daysAgo + 2),
        receivedAt: ago(daysAgo),
      };
    });

  const subtotalOf = (lines: PricedLine[]) => round2(lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0));

  const poFrom = (number: string, pr: PurchaseRequest, quote: Quotation, status: PurchaseOrder["status"], poApprovals: Approval[], createdDaysAgo: number, extra: Partial<PurchaseOrder> = {}): PurchaseOrder => {
    const subtotal = subtotalOf(quote.lines);
    return {
      uuid: generateUuid(),
      number,
      prUuid: pr.uuid,
      quotationUuid: quote.uuid,
      supplierUuid: quote.supplierUuid,
      projectUuid: pr.projectUuid,
      budgetCategory: pr.budgetCategory,
      lines: quote.lines,
      subtotal,
      vat: round2(subtotal * VAT),
      total: round2(subtotal * (1 + VAT)),
      deliveryDays: quote.deliveryDays,
      paymentTermsDays: quote.paymentTermsDays,
      status,
      approvals: poApprovals,
      advancePaid: 0,
      amendments: [],
      createdAt: ago(createdDaysAgo),
      ...extra,
    };
  };

  const gulf = supplier("Gulf Fiber Trading");
  const arab = supplier("Arab Cables Co.");
  const najd = supplier("Najd Civil Supplies");
  const east = supplier("Eastern Telecom Materials");
  const stc2 = find(store.Projects, (p) => p.code === "STC-002", "STC-002");
  const stc4 = find(store.Projects, (p) => p.code === "STC-004", "STC-004");

  // PR-0004 — with procurement: the stock is there, so it can go down the stock route.
  const pr4 = prOf({ number: "PR-0004", project: stc2, category: "fiber_materials", lines: [[item("SPC-024"), 10, 180]], createdDaysAgo: 3, note: "Closures for the Exit 15 splice points." }, "in_review", approvals(["direct_manager"], 2));

  // PR-0005 — quotation approval, two of six approvals in; the projects manager is next.
  const pr5Spec: PurchaseSpec = { number: "PR-0005", project: mob4, category: "civil_materials", lines: [[item("MHL-001"), 6, 1450], [item("DUC-040"), 1500, 3.1]], createdDaysAgo: 12 };
  const pr5 = prOf(pr5Spec, "quote_approval", approvals(["direct_manager"], 11), { stockAvailable: false });
  const pr5Quotes = quotesFor(pr5, [
    { supplier: najd, priceFactor: 0.96, deliveryDays: 9, paymentTermsDays: 30, qualityScore: 4 },
    { supplier: gulf, priceFactor: 1.02, deliveryDays: 6, paymentTermsDays: 45, qualityScore: 3 },
    { supplier: east, priceFactor: 0.99, deliveryDays: 14, paymentTermsDays: 60, qualityScore: 4 },
  ], 7);
  pr5.selectedQuotationUuid = pr5Quotes[0].uuid;
  pr5.quoteApprovals = approvals(["region_project_manager", "procurement"], 3);

  // PR-0006 — stock supply route, waiting for the projects manager.
  const pr6 = prOf({ number: "PR-0006", project: mob5, category: "fiber_materials", lines: [[item("FIB-048"), 1500, 4.2]], createdDaysAgo: 5 }, "stock_approval", [...approvals(["direct_manager"], 4), ...approvals(["region_project_manager"], 2)], { stockAvailable: true });

  // PR-0007 — refused by the direct manager, with the reason.
  const pr7 = prOf({ number: "PR-0007", project: stc4, category: "civil_materials", lines: [[item("DUC-040"), 800, 3.1]], createdDaysAgo: 9 }, "rejected", [
    { role: "direct_manager", decision: "rejected", actorName: nameOf("direct_manager"), at: ago(8), note: "Duplicate of PR-0002 — add the quantity there instead." },
  ]);

  // PR-0008 → PO-0002 — waiting at the finance manager (3 of 6).
  const pr8 = prOf({ number: "PR-0008", project: mob5, category: "fiber_materials", lines: [[item("ODF-024"), 12, 640]], createdDaysAgo: 18 }, "ordered", approvals(["direct_manager"], 17), { stockAvailable: false });
  const pr8Quotes = quotesFor(pr8, [
    { supplier: east, priceFactor: 0.95, deliveryDays: 10, paymentTermsDays: 30, qualityScore: 4 },
    { supplier: gulf, priceFactor: 1.0, deliveryDays: 7, paymentTermsDays: 30, qualityScore: 4 },
    { supplier: arab, priceFactor: 1.06, deliveryDays: 12, paymentTermsDays: 60, qualityScore: 3 },
  ], 14);
  pr8.selectedQuotationUuid = pr8Quotes[0].uuid;
  pr8.quoteApprovals = approvals(PURCHASE_CHAIN, 10);
  const po2 = poFrom("PO-0002", pr8, pr8Quotes[0], "pending_approval", approvals(PURCHASE_CHAIN.slice(0, 3), 4), 8);

  // PR-0009 → PO-0003 — fully approved, ready for procurement to send.
  const pr9 = prOf({ number: "PR-0009", project: stc5, category: "fiber_materials", lines: [[item("FIB-096"), 3000, 6.8]], createdDaysAgo: 22, note: "96F stock is under its reorder level." }, "ordered", approvals(["direct_manager"], 21), { stockAvailable: false });
  const pr9Quotes = quotesFor(pr9, [
    { supplier: gulf, priceFactor: 0.97, deliveryDays: 10, paymentTermsDays: 30, qualityScore: 5 },
    { supplier: arab, priceFactor: 0.99, deliveryDays: 14, paymentTermsDays: 45, qualityScore: 4 },
    { supplier: east, priceFactor: 1.04, deliveryDays: 8, paymentTermsDays: 30, qualityScore: 3 },
  ], 18);
  pr9.selectedQuotationUuid = pr9Quotes[0].uuid;
  pr9.quoteApprovals = approvals(PURCHASE_CHAIN, 13);
  const po3 = poFrom("PO-0003", pr9, pr9Quotes[0], "approved", approvals(PURCHASE_CHAIN, 4), 9);

  // PR-0010 → PO-0004 — received in two deliveries, evaluated, both invoiced.
  const pr10 = prOf({ number: "PR-0010", project: mob4, category: "fiber_materials", lines: [[item("SPC-024"), 30, 180], [item("TAP-001"), 40, 35]], createdDaysAgo: 48 }, "ordered", approvals(["direct_manager"], 47), { stockAvailable: false });
  const pr10Quotes = quotesFor(pr10, [
    { supplier: arab, priceFactor: 0.97, deliveryDays: 7, paymentTermsDays: 15, qualityScore: 4 },
    { supplier: gulf, priceFactor: 1.01, deliveryDays: 5, paymentTermsDays: 30, qualityScore: 4 },
    { supplier: najd, priceFactor: 1.08, deliveryDays: 10, paymentTermsDays: 30, qualityScore: 3 },
  ], 44);
  pr10.selectedQuotationUuid = pr10Quotes[0].uuid;
  pr10.quoteApprovals = approvals(PURCHASE_CHAIN, 41);
  const po4 = poFrom("PO-0004", pr10, pr10Quotes[0], "received", approvals(PURCHASE_CHAIN, 37), 39, {
    sentAt: ago(34),
    expectedDeliveryAt: ago(27),
    evaluation: { quality: 4, onTime: 3, price: 5, note: "Second delivery came five days late.", at: ago(10), by: nameOf("procurement") },
  });

  store.PurchaseRequests.push(pr4, pr5, pr6, pr7, pr8, pr9, pr10);
  store.Quotations.push(...pr5Quotes, ...pr8Quotes, ...pr9Quotes, ...pr10Quotes);
  store.PurchaseOrders.push(po2, po3, po4);

  const ruh = warehouse("WH-RUH");
  const jed = warehouse("WH-JED");
  const dmm = warehouse("WH-DMM");
  const price = (po: PurchaseOrder, target: Item) => find(po.lines, (l) => l.itemUuid === target.uuid, "PO line").unitPrice;

  const grn = (number: string, po: PurchaseOrder, lines: GoodsReceipt["lines"], daysAgo: number): GoodsReceipt => {
    const receipt: GoodsReceipt = { uuid: generateUuid(), number, poUuid: po.uuid, warehouseUuid: ruh.uuid, receivedAt: ago(daysAgo), receivedBy: nameOf("warehouse_keeper"), lines };
    for (const line of lines) {
      move({ type: "receipt", itemUuid: line.itemUuid, warehouseUuid: ruh.uuid, qty: line.acceptedQty, unitCost: price(po, find(store.Items, (i) => i.uuid === line.itemUuid, "item")), refKind: "goods_receipt", refUuid: receipt.uuid, refNumber: number, projectUuid: po.projectUuid, at: ago(daysAgo) });
    }
    return receipt;
  };
  const grn2 = grn("GRN-0002", po4, [{ itemUuid: item("SPC-024").uuid, receivedQty: 30, acceptedQty: 30 }], 25);
  const grn3 = grn("GRN-0003", po4, [{ itemUuid: item("TAP-001").uuid, receivedQty: 40, acceptedQty: 40 }], 12);
  store.GoodsReceipts.push(grn2, grn3);

  const apOf = (number: string, invoiceNumber: string, po: PurchaseOrder, receipt: GoodsReceipt, invoiceDaysAgo: number, status: "approved" | "paid") => {
    const subtotal = round2(receipt.lines.reduce((sum, l) => sum + l.acceptedQty * price(po, find(store.Items, (i) => i.uuid === l.itemUuid, "item")), 0));
    const vat = round2(subtotal * VAT);
    const total = round2(subtotal + vat);
    return {
      uuid: generateUuid(),
      number,
      supplierUuid: po.supplierUuid,
      invoiceNumber,
      invoiceDate: ago(invoiceDaysAgo),
      poUuid: po.uuid,
      grnUuids: [receipt.uuid],
      subtotal,
      vat,
      total,
      advanceDeducted: 0,
      netPayable: total,
      dueDate: addDays(ago(invoiceDaysAgo), po.paymentTermsDays),
      status,
      payments:
        status === "paid"
          ? [{ uuid: generateUuid(), at: ago(3), method: "bank_transfer" as const, reference: "TRX-882140", amount: total, by: nameOf("accountant"), noticeSentAt: ago(3) }]
          : [],
      registeredBy: nameOf("accountant"),
      approvedBy: nameOf("finance_manager"),
      createdAt: ago(invoiceDaysAgo - 1),
    };
  };
  store.SupplierInvoices.push(
    apOf("AP-0002", "AC-INV-21044", po4, grn2, 24, "paid"),
    apOf("AP-0003", "AC-INV-21190", po4, grn3, 11, "approved"),
  );

  // ─── Warehouse documents at every step ───────────────────────────────────

  // TR-0001 — waiting for the region accountant (1 of 5).
  // TR-0002 — completed: the balance moved Riyadh → Dammam.
  const tr1 = { uuid: generateUuid(), number: "TR-0001", fromWarehouseUuid: ruh.uuid, toWarehouseUuid: jed.uuid, lines: [{ itemUuid: item("SAF-001").uuid, qty: 10 }], status: "pending_approval" as const, approvals: approvals(["warehouse_keeper"], 1), requestedBy: nameOf("warehouse_keeper"), createdAt: ago(2) };
  const tr2 = { uuid: generateUuid(), number: "TR-0002", fromWarehouseUuid: ruh.uuid, toWarehouseUuid: dmm.uuid, lines: [{ itemUuid: item("TAP-001").uuid, qty: 20 }], status: "completed" as const, approvals: approvals(TRANSFER_CHAIN, 30), requestedBy: nameOf("warehouse_keeper"), createdAt: ago(31), completedAt: ago(29) };
  for (const line of tr2.lines) {
    const common = { itemUuid: line.itemUuid, unitCost: item("TAP-001").standardCost, refKind: "stock_transfer" as const, refUuid: tr2.uuid, refNumber: tr2.number, at: ago(29) };
    move({ ...common, type: "transfer_out", warehouseUuid: ruh.uuid, qty: -line.qty });
    move({ ...common, type: "transfer_in", warehouseUuid: dmm.uuid, qty: line.qty });
  }
  store.StockTransfers.push(tr1, tr2);

  // ST-0001 — Jeddah count waiting for the COO; ST-0002 — Dammam, settled.
  store.Stocktakes.push(
    {
      uuid: generateUuid(),
      number: "ST-0001",
      warehouseUuid: jed.uuid,
      countedAt: ago(1),
      countedBy: nameOf("warehouse_keeper"),
      lines: [
        { itemUuid: item("DUC-040").uuid, bookQty: 1500, actualQty: 1480 },
        { itemUuid: item("MHL-001").uuid, bookQty: 6, actualQty: 6 },
        { itemUuid: item("FIB-048").uuid, bookQty: 4000, actualQty: 4000 },
      ],
      status: "pending_approval",
      approvals: [],
    },
  );
  const st2 = { uuid: generateUuid(), number: "ST-0002", warehouseUuid: dmm.uuid, countedAt: ago(26), countedBy: nameOf("warehouse_keeper"), lines: [{ itemUuid: item("SAF-001").uuid, bookQty: 20, actualQty: 18 }], status: "completed" as const, approvals: approvals(["operations_manager"], 25) };
  move({ type: "adjustment", itemUuid: item("SAF-001").uuid, warehouseUuid: dmm.uuid, qty: -2, unitCost: item("SAF-001").standardCost, refKind: "stocktake", refUuid: st2.uuid, refNumber: st2.number, at: ago(25) });
  store.Stocktakes.push(st2);

  // WO-0001 — a crushed reel, waiting for the region PM (1 of 6).
  store.WriteOffs.push({
    uuid: generateUuid(),
    number: "WO-0001",
    warehouseUuid: ruh.uuid,
    lines: [{ itemUuid: item("FIB-048").uuid, qty: 50 }],
    reason: "damaged",
    investigation: "Reel crushed by a forklift while loading; the operator's report is attached to the stores log.",
    decision: "write_off",
    status: "pending_approval",
    approvals: approvals(["warehouse_keeper"], 2),
    requestedBy: nameOf("warehouse_keeper"),
    createdAt: ago(3),
  });

  // IR-0004 — approved, waiting for the storekeeper to issue it to Fiber Link.
  // IR-0005 — refused by the region PM. IR-0006 — a splicer issued and returned.
  const fiberLink = subcontractor("Fiber Link Co.");
  const ir6 = {
    uuid: generateUuid(),
    number: "IR-0006",
    projectUuid: mob5.uuid,
    warehouseUuid: ruh.uuid,
    requestedBy: nameOf("project_manager"),
    recipient: { kind: "employee" as const, name: nameOf("project_engineer") },
    lines: [{ itemUuid: item("EQP-SPL").uuid, qty: 1 }],
    inventoryFrequency: "monthly" as const,
    status: "issued" as const,
    approvals: approvals(["region_project_manager"], 121),
    signedByRecipient: nameOf("project_engineer"),
    signedByKeeper: nameOf("warehouse_keeper"),
    issuedAt: ago(120),
  };
  store.IssueRequests.push(
    {
      uuid: generateUuid(),
      number: "IR-0004",
      projectUuid: stc2.uuid,
      warehouseUuid: ruh.uuid,
      requestedBy: nameOf("project_manager"),
      recipient: { kind: "subcontractor", name: fiberLink.name, subcontractorUuid: fiberLink.uuid },
      lines: [{ itemUuid: item("SPC-024").uuid, qty: 12 }, { itemUuid: item("FIB-048").uuid, qty: 800 }],
      status: "approved",
      approvals: approvals(["region_project_manager"], 1),
    },
    {
      uuid: generateUuid(),
      number: "IR-0005",
      projectUuid: mob4.uuid,
      warehouseUuid: jed.uuid,
      requestedBy: nameOf("project_manager"),
      recipient: { kind: "cost_center", name: "CC-RUH-CIVIL" },
      lines: [{ itemUuid: item("MHL-001").uuid, qty: 4 }],
      status: "rejected",
      approvals: [{ role: "region_project_manager", decision: "rejected", actorName: nameOf("region_project_manager"), at: ago(6), note: "Issue from Riyadh — Jeddah stock is reserved for MOB-003." }],
    },
    ir6,
  );
  move({ type: "issue", itemUuid: item("EQP-SPL").uuid, warehouseUuid: ruh.uuid, qty: -1, unitCost: item("EQP-SPL").standardCost, refKind: "issue_request", refUuid: ir6.uuid, refNumber: ir6.number, projectUuid: mob5.uuid, chargedTo: ir6.recipient, at: ago(120) });
  const returned = { uuid: generateUuid(), itemUuid: item("EQP-SPL").uuid, qty: 1, employeeName: nameOf("project_engineer"), issueRequestUuid: ir6.uuid, projectUuid: mob5.uuid, inventoryFrequency: "monthly" as const, issuedAt: ago(120), lastCountedAt: ago(90), status: "returned" as const, closedAt: ago(60) };
  move({ type: "return", itemUuid: item("EQP-SPL").uuid, warehouseUuid: ruh.uuid, qty: 1, unitCost: item("EQP-SPL").standardCost, refKind: "asset_custody", refUuid: returned.uuid, refNumber: ir6.number, projectUuid: mob5.uuid, at: ago(60) });
  store.AssetCustodies.push(returned);

  // ─── Cash custody in every state ─────────────────────────────────────────

  store.CashCustodies.push(
    {
      uuid: generateUuid(),
      number: "CC-0003",
      employeeName: nameOf("project_engineer"),
      projectUuid: mob4.uuid,
      budgetCategory: "overhead",
      city: "Riyadh",
      workOrderNo: "WO-11702",
      amount: 3000,
      lines: [{ description: "Survey equipment rental", amount: 1800 }, { description: "Site consumables", amount: 1200 }],
      status: "settled",
      approvals: approvals(CASH_CHAIN, 44),
      disbursedAt: ago(40),
      receiptSignedAt: ago(40),
      settlement: { spent: 2750, returned: 250, settledAt: ago(25), by: nameOf("accountant"), note: "Receipts for every line attached." },
      createdAt: ago(46),
    },
    {
      uuid: generateUuid(),
      number: "CC-0004",
      employeeName: nameOf("project_manager"),
      projectUuid: stc2.uuid,
      budgetCategory: "permits",
      city: "Riyadh",
      workOrderNo: "WO-11931",
      amount: 2000,
      lines: [{ description: "Traffic diversion permit", amount: 2000 }],
      status: "approved",
      approvals: approvals(CASH_CHAIN, 2),
      createdAt: ago(4),
    },
    {
      uuid: generateUuid(),
      number: "CC-0005",
      employeeName: nameOf("project_engineer"),
      projectUuid: mob5.uuid,
      budgetCategory: "overhead",
      city: "Dammam",
      workOrderNo: "WO-11877",
      amount: 6500,
      lines: [{ description: "Accommodation for the splicing team", amount: 6500 }],
      status: "rejected",
      approvals: [
        ...approvals(["region_accountant"], 12),
        { role: "region_project_manager", decision: "rejected", actorName: nameOf("region_project_manager"), at: ago(11), note: "Accommodation is in the subcontract — not a custody expense." },
      ],
      createdAt: ago(13),
    },
  );

  store.Clearances.push({ uuid: generateUuid(), employeeName: "Fahad Al-Sulami", reason: "transfer", approvedAt: ago(20), approvedBy: nameOf("finance_manager") });

  // ─── Subcontractors and customers ────────────────────────────────────────

  const sc2 = find(store.Subcontracts, (s) => s.number === "SC-0002", "SC-0002");
  const albina = subcontractor("Al-Bina Contracting");
  const sc3 = {
    uuid: generateUuid(),
    number: "SC-0003",
    subcontractorUuid: albina.uuid,
    projectUuid: mob5.uuid,
    scope: "Civil works — Dammam port route",
    budgetCategory: "civil_works" as const,
    value: 180000,
    retentionPct: 10,
    advancePaid: 0,
    createdAt: ago(200),
  };
  store.Subcontracts.push(sc3);
  store.Extracts.push(
    {
      uuid: generateUuid(),
      number: "EX-0003",
      subcontractUuid: sc2.uuid,
      periodFrom: ago(35),
      periodTo: ago(5),
      lines: [
        { description: "Fiber pulling", unit: "m", qty: 2000, unitRate: 12 },
        { description: "Fusion splicing", unit: "joint", qty: 96, unitRate: 85 },
      ],
      gross: 32160,
      advanceDeduction: 0,
      retention: 1608,
      penalties: 0,
      materialsDeduction: 0,
      net: 30552,
      status: "pm_approved",
      approvals: approvals(["project_engineer", "projects_manager"], 3),
      submittedVia: "portal",
      submittedBy: sc2.subcontractorUuid === fiberLink.uuid ? fiberLink.name : albina.name,
      createdAt: ago(4),
    },
    {
      uuid: generateUuid(),
      number: "EX-0004",
      subcontractUuid: sc3.uuid,
      periodFrom: ago(190),
      periodTo: ago(150),
      lines: [{ description: "Trench excavation and duct laying", unit: "m", qty: 1000, unitRate: 40 }],
      gross: 40000,
      advanceDeduction: 0,
      retention: 4000,
      penalties: 500,
      penaltyNote: "Two days late on the backfilling milestone",
      materialsDeduction: 0,
      net: 35500,
      status: "paid",
      approvals: approvals(["project_engineer", "projects_manager", "finance_manager"], 145),
      submittedVia: "admin",
      submittedBy: nameOf("project_engineer"),
      createdAt: ago(148),
      paidAt: ago(120),
    },
  );

  const customerInvoice = (number: string, p: Project, basis: CustomerInvoice["basis"], amount: number, submittedDaysAgo: number, paidDaysAgo?: number): CustomerInvoice => ({
    uuid: generateUuid(),
    number,
    projectUuid: p.uuid,
    basis,
    amount,
    vat: round2(amount * VAT),
    total: round2(amount * (1 + VAT)),
    submittedAt: ago(submittedDaysAgo),
    dueAt: addDays(ago(submittedDaysAgo), 60),
    paidAt: paidDaysAgo === undefined ? undefined : ago(paidDaysAgo),
    createdBy: nameOf("accountant"),
  });
  store.CustomerInvoices.push(
    customerInvoice("CI-0004", mob6, "rfs", 364000, 480, 418),
    customerInvoice("CI-0005", mob6, "pac", 104000, 410, 352),
    customerInvoice("CI-0006", mob6, "fac", 52000, 30),
    customerInvoice("CI-0007", stc6, "as_built", 380000, 40),
    customerInvoice("CI-0008", stc5, "as_built", 410000, 35, 2),
  );

  // ─── Closing: the month before last is closed, every item ticked ─────────

  const firstOfThisMonth = `${now.slice(0, 7)}-01T00:00:00.000Z`;
  const twoMonthsAgo = addDays(addDays(firstOfThisMonth, -1).slice(0, 7) + "-01T00:00:00.000Z", -1).slice(0, 7);
  const closedOn = addDays(`${addDays(firstOfThisMonth, -1).slice(0, 7)}-01T00:00:00.000Z`, 4);
  const tick = { at: closedOn, by: nameOf("accountant") };
  store.ClosingPeriods.push({
    uuid: generateUuid(),
    period: twoMonthsAgo,
    items: {
      procurement_warehouse: tick,
      bank_reconciliation: tick,
      supplier_balances: tick,
      customer_balances: tick,
      custody: tick,
      payroll: { at: closedOn, by: nameOf("finance_manager") },
      depreciation: tick,
      accruals_prepayments: tick,
      financial_statements: { at: closedOn, by: nameOf("finance_manager") },
    },
    closedAt: closedOn,
    closedBy: nameOf("finance_manager"),
  });
};
