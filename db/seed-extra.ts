import { addDays, generateUuid, round2 } from "utils";
// The seed fixes each demo payslip with the same rule the payroll service uses,
// so the demo's figures are the ones the system would have calculated.
import { chargeFor, disposalGainLoss } from "../packages/services/src/rules/assets";
import { reconciliationGap } from "../packages/services/src/rules/banking";
import { overheadPool, overheadShares } from "../packages/services/src/rules/costs";
import { computePayslip, timesheetFromAttendance } from "../packages/services/src/rules/payroll";
import { AssetCategory, BudgetCategory, EmploymentType, ExpenseCategory, Nationality, StaffRole } from "./enum";
import {
  AssetHolder,
  AttendanceEntry,
  BudgetStudyLine,
  Employee,
  Expense,
  FixedAsset,
  PricedLine,
  Store,
  SupplierReturn,
  Timesheet,
} from "./types";

// DEMO DATA for the parts built after the first MVP: annual contracts, supplier
// returns, payroll, fixed assets, the budget study, cost centres, expenses,
// overhead, banks, cheques, guarantees and tax filings. Each record is placed to
// show one screen or rule.

const VAT = 0.15;

export const addExtraDemoData = (store: Store, now: string): void => {
  const ago = (days: number): string => addDays(now, -days);
  const ahead = (days: number): string => addDays(now, days);
  const find = <T>(rows: T[], match: (row: T) => boolean, what: string): T => {
    const row = rows.find(match);
    if (!row) {
      throw new Error(`Extra seed is missing ${what}`);
    }
    return row;
  };
  const nameOf = (role: StaffRole): string => find(store.StaffUsers, (u) => u.role === role, role).name;
  const item = (code: string) => find(store.Items, (i) => i.code === code, code);
  const supplier = (name: string) => find(store.Suppliers, (s) => s.name === name, name);
  const po = (number: string) => find(store.PurchaseOrders, (p) => p.number === number, number);
  const ruh = find(store.Warehouses, (w) => w.code === "WH-RUH", "WH-RUH");

  // ─── Annual contracts ────────────────────────────────────────────────────

  store.SupplierContracts = [
    {
      // Prices both items of PR-0002 (in RFQ): that request can be ordered under
      // it. Ends in 20 days, so its renewal alert is live.
      uuid: generateUuid(),
      number: "AC-0001",
      supplierUuid: supplier("Najd Civil Supplies").uuid,
      title: "Manholes and duct — 2025/26",
      startsAt: ago(345),
      endsAt: ahead(20),
      lines: [
        { itemUuid: item("MHL-001").uuid, unitPrice: 1390 },
        { itemUuid: item("DUC-040").uuid, unitPrice: 2.9 },
      ],
      deliveryDays: 10,
      paymentTermsDays: 45,
      latePenaltyPctPerDay: 0.5,
      latePenaltyCapPct: 10,
      createdBy: nameOf("procurement"),
      createdAt: ago(350),
    },
    {
      uuid: generateUuid(),
      number: "AC-0002",
      supplierUuid: supplier("Arab Cables Co.").uuid,
      title: "Fiber cable and splice closures — 2026",
      startsAt: ago(45),
      endsAt: ahead(320),
      lines: [
        { itemUuid: item("FIB-048").uuid, unitPrice: 4.05 },
        { itemUuid: item("FIB-096").uuid, unitPrice: 6.5 },
        { itemUuid: item("SPC-024").uuid, unitPrice: 170 },
      ],
      deliveryDays: 14,
      paymentTermsDays: 60,
      latePenaltyPctPerDay: 0.25,
      latePenaltyCapPct: 5,
      createdBy: nameOf("procurement"),
      createdAt: ago(50),
    },
  ];

  // PO-0001 is late: with these terms its next invoice carries a penalty.
  const po1 = po("PO-0001");
  po1.latePenaltyPctPerDay = 0.5;
  po1.latePenaltyCapPct = 10;

  // ─── Returns to suppliers ────────────────────────────────────────────────

  const priced = (number: string, code: string, qty: number): PricedLine => ({
    itemUuid: item(code).uuid,
    qty,
    unitPrice: find(po(number).lines, (l) => l.itemUuid === item(code).uuid, `${number} ${code}`).unitPrice,
  });
  const totals = (lines: PricedLine[]) => {
    const subtotal = round2(lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0));
    return { subtotal, vat: round2(subtotal * VAT), total: round2(subtotal * (1 + VAT)) };
  };
  const grn1 = find(store.GoodsReceipts, (g) => g.number === "GRN-0001", "GRN-0001");
  const po4 = po("PO-0004");

  const rejected: PricedLine[] = [priced("PO-0001", "DUC-040", 20)];
  const debit: PricedLine[] = [priced("PO-0004", "SPC-024", 2)];
  const replace: PricedLine[] = [priced("PO-0004", "TAP-001", 5)];

  const returns: SupplierReturn[] = [
    {
      // The 20 m crushed in transit on GRN-0001: back to the supplier, still owed on PO-0001.
      uuid: generateUuid(),
      number: "RTN-0001",
      poUuid: po1.uuid,
      supplierUuid: po1.supplierUuid,
      grnUuid: grn1.uuid,
      warehouseUuid: grn1.warehouseUuid,
      source: "rejected_at_receipt",
      lines: rejected,
      reason: "20 m crushed in transit",
      remedy: "replacement",
      status: "awaiting_replacement",
      ...totals(rejected),
      appliedToInvoices: [],
      createdBy: grn1.receivedBy,
      createdAt: grn1.receivedAt,
    },
    {
      // Faulty closures found in stock: a debit note, open until the next Arab Cables invoice.
      uuid: generateUuid(),
      number: "RTN-0002",
      poUuid: po4.uuid,
      supplierUuid: po4.supplierUuid,
      warehouseUuid: ruh.uuid,
      source: "from_stock",
      lines: debit,
      reason: "Cracked housings found at issue",
      remedy: "debit_note",
      status: "settled",
      ...totals(debit),
      debitNoteNumber: "DN-0001",
      appliedToInvoices: [],
      createdBy: nameOf("warehouse_keeper"),
      createdAt: ago(10),
      settledAt: ago(10),
    },
    {
      // Wrong tape colour: the replacement has not arrived yet.
      uuid: generateUuid(),
      number: "RTN-0003",
      poUuid: po4.uuid,
      supplierUuid: po4.supplierUuid,
      warehouseUuid: ruh.uuid,
      source: "from_stock",
      lines: replace,
      reason: "Wrong colour — blue tape delivered, yellow ordered",
      remedy: "replacement",
      status: "awaiting_replacement",
      ...totals(replace),
      appliedToInvoices: [],
      createdBy: nameOf("warehouse_keeper"),
      createdAt: ago(4),
    },
  ];
  store.SupplierReturns = returns;

  for (const ret of returns.filter((r) => r.source === "from_stock")) {
    for (const line of ret.lines) {
      store.StockMovements.push({
        uuid: generateUuid(),
        type: "return",
        itemUuid: line.itemUuid,
        warehouseUuid: ret.warehouseUuid,
        qty: -line.qty,
        unitCost: line.unitPrice,
        refKind: "supplier_return",
        refUuid: ret.uuid,
        refNumber: ret.number,
        projectUuid: po4.projectUuid,
        at: ret.createdAt,
        by: ret.createdBy,
      });
    }
  }

  // ─── Payroll ─────────────────────────────────────────────────────────────

  const project = (code: string) => find(store.Projects, (p) => p.code === code, code).uuid;
  const period = (monthsAgo: number): string => {
    const d = new Date(now);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - monthsAgo, 1)).toISOString().slice(0, 7);
  };
  const lastMonth = period(1);
  const twoMonthsAgo = period(2);

  let serial = 0;
  const employee = (
    name: string,
    jobTitle: string,
    nationality: Nationality,
    employmentType: EmploymentType,
    pay: { basic?: number; housing?: number; transport?: number; daily?: number },
    defaultProject?: string,
  ): Employee => {
    serial += 1;
    return {
      uuid: generateUuid(),
      code: `EMP-${String(serial).padStart(3, "0")}`,
      name,
      jobTitle,
      nationality,
      employmentType,
      basicSalary: pay.basic ?? 0,
      housingAllowance: pay.housing ?? 0,
      transportAllowance: pay.transport ?? 0,
      dailyRate: pay.daily,
      iban: `SA03800000006080${String(100000 + serial * 7919).padStart(8, "0")}`,
      bankName: serial % 2 === 0 ? "Al Rajhi Bank" : "Saudi National Bank",
      defaultProjectUuid: defaultProject ? project(defaultProject) : undefined,
      joinedAt: ago(400 - serial * 10),
      active: true,
    };
  };

  store.Employees = [
    employee("Saeed Al-Malki", "Project engineer", "saudi", "monthly", { basic: 11000, housing: 2750, transport: 1000 }, "MOB-001"),
    employee("Bandar Al-Qahtani", "Site supervisor", "saudi", "monthly", { basic: 8000, housing: 2000, transport: 800 }, "STC-002"),
    employee("Mohammed Rafiq", "Fiber splicing technician", "non_saudi", "monthly", { basic: 4200, housing: 1050, transport: 400 }, "MOB-001"),
    employee("Arjun Nair", "Fiber splicing technician", "non_saudi", "monthly", { basic: 4000, housing: 1000, transport: 400 }, "MOB-004"),
    employee("Tariq Hussain", "Civil foreman", "non_saudi", "monthly", { basic: 5200, housing: 1300, transport: 500 }, "MOB-005"),
    employee("Ahmed Saber", "Safety officer", "non_saudi", "monthly", { basic: 5600, housing: 1400, transport: 500 }, "STC-005"),
    employee("Lama Al-Subaie", "Accountant", "saudi", "monthly", { basic: 9500, housing: 2375, transport: 900 }),
    employee("Ravi Kumar", "Labourer", "non_saudi", "daily", { daily: 130 }, "MOB-001"),
    employee("Imran Khan", "Labourer", "non_saudi", "daily", { daily: 130 }, "MOB-004"),
    employee("Joseph Mathew", "Equipment operator", "non_saudi", "daily", { daily: 180 }, "MOB-005"),
  ];
  const emp = (code: string) => find(store.Employees, (e) => e.code === code, code);

  // Monthly staff split across sites; one absence and some overtime to show the rules.
  const sheet = (code: string, p: string, allocations: [string | null, number][], absentDays = 0, overtimeHours = 0): Timesheet => ({
    uuid: generateUuid(),
    employeeUuid: emp(code).uuid,
    period: p,
    allocations: allocations.map(([c, days]) => ({ projectUuid: c ? project(c) : undefined, days })),
    absentDays,
    overtimeHours,
    submittedBy: nameOf("project_manager"),
    submittedAt: ago(3),
  });
  store.Timesheets = [twoMonthsAgo, lastMonth].flatMap((p) => [
    sheet("EMP-001", p, [["MOB-001", 18], ["MOB-002", 12]]),
    sheet("EMP-002", p, [["STC-002", 20], ["STC-005", 10]], 0, p === lastMonth ? 12 : 0),
    sheet("EMP-003", p, [["MOB-001", 28]], p === lastMonth ? 2 : 0, 16),
    sheet("EMP-004", p, [["MOB-004", 30]], 0, 8),
    sheet("EMP-005", p, [["MOB-005", 22], ["MOB-001", 8]]),
    sheet("EMP-006", p, [["STC-005", 15], ["STC-002", 15]]),
    sheet("EMP-007", p, [[null, 30]]),
  ]);

  // The daily workers' attendance app: working days of the last two months and this one.
  const attendance: AttendanceEntry[] = [];
  const daysOf = (p: string): string[] => {
    const [year, month] = p.split("-").map(Number);
    const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return Array.from({ length: count }, (_, i) => new Date(Date.UTC(year, month - 1, i + 1)))
      .filter((d) => d.getUTCDay() !== 5 && d.toISOString() <= now)
      .map((d) => d.toISOString());
  };
  for (const [code, site, hours] of [
    ["EMP-008", "MOB-001", 9],
    ["EMP-009", "MOB-004", 8],
    ["EMP-010", "MOB-005", 10],
  ] as const) {
    for (const date of [...daysOf(twoMonthsAgo), ...daysOf(lastMonth), ...daysOf(period(0))]) {
      attendance.push({
        uuid: generateUuid(),
        employeeUuid: emp(code).uuid,
        date,
        projectUuid: project(site),
        hours,
        source: "attendance_app",
        recordedBy: "Attendance app",
      });
    }
  }
  store.AttendanceEntries = attendance;

  const runFor = (p: string) =>
    store.Employees.map((e) =>
      computePayslip(
        e,
        e.employmentType === "daily"
          ? timesheetFromAttendance(attendance.filter((a) => a.employeeUuid === e.uuid && a.date.slice(0, 7) === p))
          : store.Timesheets.find((t) => t.employeeUuid === e.uuid && t.period === p),
      ),
    );

  store.PayrollRuns = [
    {
      // Paid: its labour cost is booked against the projects' manpower budgets.
      uuid: generateUuid(),
      number: `PAY-${twoMonthsAgo}`,
      period: twoMonthsAgo,
      status: "paid",
      payslips: runFor(twoMonthsAgo),
      approvals: [{ role: "finance_manager", decision: "approved", actorName: nameOf("finance_manager"), at: ago(36) }],
      createdBy: nameOf("accountant"),
      createdAt: ago(37),
      paidAt: ago(35),
      paidBy: nameOf("accountant"),
      bankReference: "SNB-WPS-77120",
    },
    {
      // Calculated, waiting for the finance manager — in her approvals inbox.
      uuid: generateUuid(),
      number: `PAY-${lastMonth}`,
      period: lastMonth,
      status: "draft",
      payslips: runFor(lastMonth),
      approvals: [],
      createdBy: nameOf("accountant"),
      createdAt: ago(1),
    },
  ];

  // ─── Fixed assets ────────────────────────────────────────────────────────

  const wh = (code: string): AssetHolder => ({
    kind: "warehouse",
    warehouseUuid: find(store.Warehouses, (w) => w.code === code, code).uuid,
  });
  const holderOf = (employeeName: string): AssetHolder => ({ kind: "employee", employeeName });
  const counted = (daysAgo: number, condition = "Good, in use") => ({ at: ago(daysAgo), by: nameOf("warehouse_keeper"), found: true, condition });
  let assetSerial = 0;
  const asset = (
    name: string,
    category: AssetCategory,
    serialNumber: string,
    boughtDaysAgo: number,
    cost: number,
    salvageValue: number,
    usefulLifeMonths: number,
    holder: AssetHolder,
    projectCode?: string,
    extra: Partial<FixedAsset> = {},
  ): FixedAsset => {
    assetSerial += 1;
    return {
      uuid: generateUuid(),
      number: `FA-${String(assetSerial).padStart(4, "0")}`,
      name,
      category,
      serialNumber,
      purchaseDate: ago(boughtDaysAgo),
      cost,
      salvageValue,
      usefulLifeMonths,
      holder,
      projectUuid: projectCode ? project(projectCode) : undefined,
      status: "active",
      transfers: [],
      counts: [],
      createdBy: nameOf("accountant"),
      createdAt: ago(boughtDaysAgo),
      ...extra,
    };
  };

  const navara = asset("Nissan Navara pickup", "vehicles", "JN1CPUD22-0045812", 1500, 98000, 25000, 60, holderOf("Bandar Al-Qahtani"), "STC-002");
  const sold = disposalGainLoss(navara, ago(60), 38000);

  store.FixedAssets = [
    asset("Toyota Hilux pickup", "vehicles", "MR0FA3CD5-0091733", 700, 118000, 30000, 60, holderOf("Bandar Al-Qahtani"), "STC-002", {
      counts: [counted(150)],
    }),
    asset("Toyota Hilux pickup", "vehicles", "MR0FA3CD5-0104456", 420, 121500, 30000, 60, holderOf("Tariq Hussain"), "MOB-005"),
    asset("Fujikura 90S fusion splicer", "test_equipment", "FJK-90S-218841", 560, 42000, 4000, 48, holderOf("Mohammed Rafiq"), "MOB-001", {
      counts: [counted(140, "Good — electrodes replaced")],
    }),
    asset("Fujikura 90S fusion splicer", "test_equipment", "FJK-90S-230017", 300, 42000, 4000, 48, wh("WH-RUH")),
    asset("EXFO MaxTester OTDR", "test_equipment", "EXFO-MAX-715520", 380, 38000, 3000, 48, holderOf("Arjun Nair"), "MOB-004", {
      counts: [counted(130)],
    }),
    asset("CAT 301.7 mini excavator", "heavy_equipment", "CAT0301-7JLK02210", 900, 165000, 45000, 84, wh("WH-DMM"), "MOB-005", {
      transfers: [
        { at: ago(210), by: nameOf("warehouse_keeper"), from: wh("WH-RUH"), to: wh("WH-DMM"), note: "Moved for the Dammam port link" },
      ],
    }),
    asset("Diesel generator 20 kVA", "heavy_equipment", "GEN-20KVA-55190", 250, 28000, 3000, 60, wh("WH-JED")),
    asset("Dell Latitude laptops (5)", "it_equipment", "DL-LAT-5540-BATCH7", 500, 24500, 0, 36, holderOf("Lama Al-Subaie")),
    {
      ...navara,
      status: "disposed",
      disposal: { at: ago(60), by: nameOf("finance_manager"), kind: "sale", proceeds: 38000, ...sold, note: "Sold at auction" },
    },
  ];

  // The last two months' depreciation is posted; this month's is not yet.
  store.DepreciationRuns = [twoMonthsAgo, lastMonth].map((p, i) => {
    const lines = store.FixedAssets.map((a) => ({ assetUuid: a.uuid, amount: chargeFor(a, p) })).filter((l) => l.amount > 0);
    return {
      uuid: generateUuid(),
      period: p,
      lines,
      total: round2(lines.reduce((sum, l) => sum + l.amount, 0)),
      postedBy: nameOf("accountant"),
      postedAt: ago(i === 0 ? 33 : 2),
    };
  });

  // ─── Budget study ────────────────────────────────────────────────────────

  const line = (
    category: BudgetCategory,
    description: string,
    unit: string,
    qty: number,
    unitCost: number,
    extra: Partial<BudgetStudyLine> = {},
  ): BudgetStudyLine => ({ uuid: generateUuid(), category, description, unit, qty, unitCost, ...extra });
  const budgetOf = (code: string) => find(store.ProjectBudgets, (b) => b.projectUuid === project(code), `${code} budget`);

  // MOB-001: the study behind its approved budget, line for line — applying it changes nothing.
  const mob1Budget = budgetOf("MOB-001");
  const mob1Start = find(store.Projects, (p) => p.code === "MOB-001", "MOB-001").createdAt;
  const after = (days: number) => addDays(mob1Start, days);
  mob1Budget.study = [
    line("civil_works", "Trench excavation", "m", 2000, 65, { workType: "civil" }),
    line("civil_works", "Pipe laying", "m", 2000, 25, { workType: "civil" }),
    line("civil_works", "Manhole installation", "pcs", 16, 3000, { workType: "civil" }),
    line("civil_works", "Concrete backfilling and paving", "m²", 800, 40, { workType: "civil" }),
    line("fiber_works", "Cable pulling", "m", 2400, 15, { workType: "fiber" }),
    line("fiber_works", "Splicing and termination", "joint", 48, 500, { workType: "fiber" }),
    line("fiber_materials", "Fiber cable 48F", "m", 12000, 4.2),
    line("fiber_materials", "Splice closures 24F", "pcs", 40, 180),
    line("fiber_materials", "ODF 24 port", "pcs", 20, 620),
    line("civil_materials", "HDPE duct 40mm", "m", 8000, 3.1),
    line("civil_materials", "Precast manholes", "pcs", 12, 1450),
    line("civil_materials", "Warning tape", "roll", 80, 35),
    line("equipment", "Mini excavator", "day", 1, 250, { duration: 60, supplyType: "company_asset", workType: "civil" }),
    line("equipment", "Fusion splicer", "day", 1, 100, { duration: 40, supplyType: "company_asset", workType: "fiber" }),
    line("equipment", "Plate compactor", "day", 1, 200, { duration: 30, supplyType: "daily_rent", workType: "civil" }),
    line("manpower", "Site engineer", "person-month", 1, 9000, { duration: 3 }),
    line("manpower", "Fiber technician", "person-month", 2, 4000, { duration: 3 }),
    line("manpower", "Labourer", "person-month", 3, 3000, { duration: 1 }),
    line("permits", "Municipality excavation permit", "permit", 1, 7000),
    line("permits", "Traffic permit", "permit", 1, 3000),
    line("permits", "MOT permit", "permit", 1, 2000),
    line("overhead", "Head-office share", "lump sum", 1, 18000),
  ];
  mob1Budget.schedule = [
    { uuid: generateUuid(), resource: "materials", description: "Civil materials delivered", startsAt: after(12), endsAt: after(16) },
    { uuid: generateUuid(), resource: "materials", description: "Fiber materials delivered", startsAt: after(40), endsAt: after(45) },
    { uuid: generateUuid(), resource: "equipment", description: "Mini excavator on site", startsAt: after(30), endsAt: after(90) },
    { uuid: generateUuid(), resource: "equipment", description: "Fusion splicer", startsAt: after(80), endsAt: after(120) },
    { uuid: generateUuid(), resource: "manpower", description: "Civil crew", startsAt: after(28), endsAt: after(100) },
    { uuid: generateUuid(), resource: "manpower", description: "Splicing team", startsAt: after(78), endsAt: after(125) },
  ];

  // MOB-003 (draft budget): a fuller study than the draft — applying it rewrites the draft lines.
  budgetOf("MOB-003").study = [
    line("civil_works", "Trench excavation", "m", 1500, 65, { workType: "civil" }),
    line("civil_works", "Pipe laying and backfilling", "m", 1500, 32, { workType: "civil" }),
    line("fiber_materials", "Fiber cable 96F", "m", 7000, 6.8),
    line("fiber_materials", "Splice closures", "pcs", 20, 180),
    line("civil_materials", "HDPE duct 40mm", "m", 6000, 3.1),
    line("civil_materials", "Precast manholes", "pcs", 14, 1450),
    line("equipment", "Excavator", "day", 1, 400, { duration: 30, supplyType: "daily_rent", workType: "civil" }),
    line("manpower", "Site engineer", "person-month", 1, 9000, { duration: 2 }),
    line("manpower", "Civil crew", "person-month", 4, 3500, { duration: 2 }),
    line("permits", "Municipality excavation permit", "permit", 1, 8000),
    line("permits", "Traffic permit", "permit", 1, 2500),
  ];

  // ─── Cost centres and manual expenses ────────────────────────────────────

  const center = (code: string, name: string, kind: "department" | "vehicle") => ({ uuid: generateUuid(), code, name, kind });
  store.CostCenters = [
    center("HO-ADM", "Head office administration", "department"),
    center("HO-PRC", "Procurement department", "department"),
    center("HO-WH", "Warehouses", "department"),
    center("VEH-01", "Toyota Hilux — MR0FA3CD5-0091733", "vehicle"),
    center("VEH-02", "Toyota Hilux — MR0FA3CD5-0104456", "vehicle"),
  ];
  const cc = (code: string) =>
    store.CostCenters.find((c) => c.code === code)?.uuid ?? find(store.Projects, (p) => p.code === code, code).uuid;

  let expenseSerial = 0;
  const expense = (
    at: string,
    description: string,
    category: ExpenseCategory,
    budgetCategory: BudgetCategory,
    split: [string, number][],
    vatable = true,
  ): Expense => {
    expenseSerial += 1;
    const amount = round2(split.reduce((sum, [, a]) => sum + a, 0));
    return {
      uuid: generateUuid(),
      number: `EXP-${String(expenseSerial).padStart(4, "0")}`,
      date: at,
      description,
      category,
      budgetCategory,
      amount,
      vat: vatable ? round2(amount * VAT) : 0,
      allocations: split.map(([code, a]) => ({ costCenterUuid: cc(code), amount: a })),
      createdBy: nameOf("accountant"),
      createdAt: at,
    };
  };
  const dayOf = (p: string, day: number) => `${p}-${String(day).padStart(2, "0")}T09:00:00.000Z`;
  store.Expenses = [
    expense(dayOf(twoMonthsAgo, 3), "Head office rent", "office", "overhead", [["HO-ADM", 18000]]),
    expense(dayOf(twoMonthsAgo, 18), "Electricity and water", "utilities", "overhead", [["HO-ADM", 2100]]),
    expense(dayOf(twoMonthsAgo, 21), "Hilux service and tyres", "vehicle", "equipment", [["VEH-01", 1200], ["STC-002", 1200]]),
    expense(dayOf(lastMonth, 3), "Head office rent", "office", "overhead", [["HO-ADM", 18000]]),
    expense(dayOf(lastMonth, 9), "Crew accommodation — Dammam", "travel", "manpower", [["MOB-005", 4200]]),
    expense(dayOf(lastMonth, 14), "Fuel cards", "fuel", "equipment", [["VEH-02", 1800], ["MOB-005", 1800]]),
    expense(dayOf(lastMonth, 17), "Vehicle insurance renewal", "vehicle", "overhead", [["VEH-01", 3000], ["VEH-02", 3000]], false),
    expense(dayOf(lastMonth, 20), "Mobile lines and data", "communications", "overhead", [["HO-ADM", 1500]]),
    expense(dayOf(lastMonth, 24), "Procurement tender fees", "other", "overhead", [["HO-PRC", 900]]),
  ];

  // ─── Overhead allocation ─────────────────────────────────────────────────

  // Two months ago is allocated, in equal shares; last month is left to allocate.
  const parts = overheadPool(store, twoMonthsAgo);
  const pool = round2(parts.expenses + parts.payroll + parts.depreciation);
  store.OverheadAllocations = [
    {
      uuid: generateUuid(),
      period: twoMonthsAgo,
      basis: "equal",
      pool,
      poolParts: parts,
      lines: overheadShares(
        pool,
        store.ProjectBudgets.filter((b) => b.status === "approved").map((b) => ({ projectUuid: b.projectUuid, value: 1 })),
      ),
      postedBy: nameOf("finance_manager"),
      postedAt: ago(30),
    },
  ];

  // ─── Banks, cheques, guarantees, tax filings ─────────────────────────────

  store.BankAccounts = [
    {
      uuid: generateUuid(),
      code: "SNB-OPS",
      name: "Operations account",
      bank: "Saudi National Bank",
      iban: "SA4410000001234567890123",
      openingBalance: 2400000,
      openingDate: ago(730),
      primary: true,
    },
    {
      uuid: generateUuid(),
      code: "RJH-PRJ",
      name: "Projects collections",
      bank: "Al Rajhi Bank",
      iban: "SA8780000201608010167519",
      openingBalance: 650000,
      openingDate: ago(730),
      primary: false,
    },
  ];
  const [ops, collections] = store.BankAccounts;
  const invoice = (number: string) => find(store.SupplierInvoices, (i) => i.number === number, number);
  const customerInvoice = (number: string) => find(store.CustomerInvoices, (i) => i.number === number, number);

  // AP-0002 was paid by a cheque that has since cleared.
  const ap2 = invoice("AP-0002");
  const ap2Payment = ap2.payments[0];
  const ap2Cheque = {
    uuid: generateUuid(),
    number: "004512",
    direction: "issued" as const,
    bankAccountUuid: ops.uuid,
    party: find(store.Suppliers, (s) => s.uuid === ap2.supplierUuid, "AP-0002 supplier").name,
    amount: ap2Payment.amount,
    issuedAt: ap2Payment.at,
    dueDate: ap2Payment.at,
    status: "cleared" as const,
    ref: { kind: "supplier_invoice" as const, uuid: ap2.uuid, label: ap2.number, paymentUuid: ap2Payment.uuid },
    clearedAt: addDays(ap2Payment.at, 2),
  };
  ap2Payment.method = "cheque";
  ap2Payment.reference = "CHQ 004512";
  ap2Payment.bankAccountUuid = ops.uuid;
  ap2Payment.chequeUuid = ap2Cheque.uuid;

  // AP-0003: SAR 1,000 paid by a post-dated cheque, due in 12 days; the rest still owed.
  const ap3 = invoice("AP-0003");
  const ap3PaymentUuid = generateUuid();
  const ap3Cheque = {
    uuid: generateUuid(),
    number: "004538",
    direction: "issued" as const,
    bankAccountUuid: ops.uuid,
    party: find(store.Suppliers, (s) => s.uuid === ap3.supplierUuid, "AP-0003 supplier").name,
    amount: 1000,
    issuedAt: ago(3),
    dueDate: ahead(12),
    status: "pending" as const,
    ref: { kind: "supplier_invoice" as const, uuid: ap3.uuid, label: ap3.number, paymentUuid: ap3PaymentUuid },
  };
  ap3.payments.push({
    uuid: ap3PaymentUuid,
    at: ago(3),
    method: "cheque",
    reference: "CHQ 004538 (post-dated)",
    amount: 1000,
    by: nameOf("accountant"),
    noticeSentAt: ago(3),
    bankAccountUuid: ops.uuid,
    chequeUuid: ap3Cheque.uuid,
  });

  // CI-0001 was collected into the projects account by bank transfer.
  customerInvoice("CI-0001").collectedToUuid = collections.uuid;

  // CI-0003: STC's cheque bounced twelve days ago, so the invoice is open again.
  const ci3 = customerInvoice("CI-0003");
  const bounced = {
    uuid: generateUuid(),
    number: "781204",
    direction: "received" as const,
    bankAccountUuid: collections.uuid,
    party: "STC",
    amount: ci3.total,
    issuedAt: ago(16),
    dueDate: ago(14),
    status: "bounced" as const,
    ref: { kind: "customer_invoice" as const, uuid: ci3.uuid, label: ci3.number },
    bouncedAt: ago(12),
    bounceReason: "Signature mismatch — re-issue requested",
  };
  store.Cheques = [ap2Cheque, ap3Cheque, bounced];

  // Last month is reconciled on both accounts (its closing has bank reconciliation ticked).
  store.BankReconciliations = store.BankAccounts.map((account) => {
    const gap = reconciliationGap(store, account, lastMonth);
    return {
      uuid: generateUuid(),
      bankAccountUuid: account.uuid,
      period: lastMonth,
      statementBalance: gap.expectedStatement,
      bookBalance: gap.bookBalance,
      outstandingIssued: gap.outstandingIssued,
      uncreditedReceived: gap.uncreditedReceived,
      by: nameOf("accountant"),
      at: ago(1),
    };
  });

  store.LettersOfGuarantee = [
    {
      uuid: generateUuid(),
      number: "LG-SNB-22071",
      bank: "Saudi National Bank",
      kind: "performance",
      beneficiary: "Mobily",
      projectUuid: project("MOB-001"),
      amount: 64000,
      issuedAt: ago(70),
      expiresAt: ahead(300),
    },
    {
      // Expires in 20 days — the renewal alert is live.
      uuid: generateUuid(),
      number: "LG-RJH-10388",
      bank: "Al Rajhi Bank",
      kind: "advance_payment",
      beneficiary: "STC",
      projectUuid: project("STC-005"),
      amount: 32800,
      issuedAt: ago(345),
      expiresAt: ahead(20),
    },
    {
      uuid: generateUuid(),
      number: "LG-SNB-21950",
      bank: "Saudi National Bank",
      kind: "bid",
      beneficiary: "Mobily",
      amount: 25000,
      issuedAt: ago(200),
      expiresAt: ago(20),
      releasedAt: ago(40),
      note: "Released after award",
    },
  ];

  // VAT and GOSI filed for every month but the last, which is still open.
  const vatNet = (p: string) =>
    round2(
      store.CustomerInvoices.filter((i) => i.submittedAt.slice(0, 7) === p).reduce((sum, i) => sum + i.vat, 0) -
        store.SupplierInvoices.filter((i) => i.status !== "rejected" && i.invoiceDate.slice(0, 7) === p).reduce((sum, i) => sum + i.vat, 0) -
        store.Expenses.filter((e) => e.date.slice(0, 7) === p).reduce((sum, e) => sum + e.vat, 0),
    );
  const gosi = (p: string) =>
    round2(
      (store.PayrollRuns.find((r) => r.period === p)?.payslips ?? []).reduce((sum, s) => sum + s.gosiEmployee + s.gosiEmployer, 0),
    );
  store.TaxFilings = [2, 3, 4, 5, 6].flatMap((monthsAgo) => {
    const p = period(monthsAgo);
    return [
      { uuid: generateUuid(), kind: "vat" as const, period: p, amount: vatNet(p), reference: `ZATCA-${p.replace("-", "")}`, filedAt: addDays(`${p}-01T00:00:00.000Z`, 50), by: nameOf("accountant") },
      { uuid: generateUuid(), kind: "gosi" as const, period: p, amount: gosi(p), reference: `GOSI-${p.replace("-", "")}`, filedAt: addDays(`${p}-01T00:00:00.000Z`, 42), by: nameOf("accountant") },
    ];
  });
};
