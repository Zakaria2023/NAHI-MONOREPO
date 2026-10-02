import { addDays, generateUuid, round2 } from "utils";
// The seed fixes each demo payslip with the same rule the payroll service uses,
// so the demo's figures are the ones the system would have calculated.
import { chargeFor, disposalGainLoss } from "../packages/services/src/rules/assets";
import { computePayslip, timesheetFromAttendance } from "../packages/services/src/rules/payroll";
import { AssetCategory, EmploymentType, Nationality, StaffRole } from "./enum";
import { AssetHolder, AttendanceEntry, Employee, FixedAsset, PricedLine, Store, SupplierReturn, Timesheet } from "./types";

// DEMO DATA for the parts built after the first MVP: annual contracts, supplier
// returns, payroll and fixed assets. Each record is placed to show one screen or rule.

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
};
