import { addDays, formatPeriod, recentPeriods, round2, sumBy } from "utils";
import { BudgetCategory, budgetCategories } from "../../../../db/enum";
import { BUDGET_CATEGORY_LABELS, OPERATOR_LABELS, PAYMENT_METHOD_LABELS } from "../../../../db/label";
import { Store } from "../../../../db/types";
import { budgetUsage } from "../budgets";
import { costCenterOptions } from "../expenses";
import { bookedPayrollRuns, laborCostByProject } from "../payroll";
import { balanceAt, bankMovements } from "../rules/banking";
import { journal } from "../rules/ledger";
import { ReportData, ReportParams, ReportRow, col } from "./report";

// FINANCE REPORTS (finance §1–4, §6–9): what is owed and to whom, what each
// project earns and costs, and where the cash goes.

const DAY_MS = 24 * 60 * 60 * 1000;
const projectCode = (store: Store, uuid?: string) => (uuid ? (store.Projects.find((p) => p.uuid === uuid)?.code ?? "") : "Head office");
const supplierName = (store: Store, uuid: string) => store.Suppliers.find((s) => s.uuid === uuid)?.name ?? "?";
const paidOf = (payments: { amount: number }[]) => round2(sumBy(payments, (p) => p.amount));
const total = (rows: ReportRow[], key: string) => round2(sumBy(rows, (r) => Number(r.cells[key] ?? 0)));

/** Cost to date by project from the ledger: every project-cost line, plus the overhead allocated to it. */
const projectCosts = (store: Store, now: string): Map<string, number> => {
  const costs = new Map<string, number>();
  for (const line of journal(store, now).flatMap((e) => e.lines)) {
    if (line.projectUuid && (line.account.startsWith("5") || line.account === "6100")) {
      costs.set(line.projectUuid, round2((costs.get(line.projectUuid) ?? 0) + line.debit - line.credit));
    }
  }
  for (const line of store.OverheadAllocations.flatMap((o) => o.lines)) {
    costs.set(line.projectUuid, round2((costs.get(line.projectUuid) ?? 0) + line.amount));
  }
  return costs;
};

// ─── Payables and subcontractors ───

/** Supplier invoices not yet paid, or not yet approved (الفواتير المعلقة). */
export const pendingSupplierInvoices = (store: Store, _params: ReportParams, now: string): ReportData => {
  const rows = store.SupplierInvoices.filter((i) => i.status === "registered" || i.status === "approved").map((i) => {
    const outstanding = round2(i.netPayable - paidOf(i.payments));
    return {
      key: i.uuid,
      href: `/finance/payables/${i.uuid}`,
      cells: {
        number: i.number,
        supplier: supplierName(store, i.supplierUuid),
        invoice: i.invoiceNumber,
        status: i.status === "registered" ? "Awaiting approval" : "Approved, unpaid",
        netPayable: i.netPayable,
        paid: paidOf(i.payments),
        outstanding,
        due: i.dueDate,
        overdue: i.dueDate < now ? Math.floor((new Date(now).getTime() - new Date(i.dueDate).getTime()) / DAY_MS) : null,
      },
    };
  });
  return {
    figures: [{ label: "Outstanding", value: total(rows, "outstanding"), kind: "money" }],
    columns: [
      col("number", "Invoice"),
      col("supplier", "Supplier"),
      col("invoice", "Supplier's no."),
      col("status", "Status"),
      col("netPayable", "Net payable", "money"),
      col("paid", "Paid", "money"),
      col("outstanding", "Outstanding", "money"),
      col("due", "Due", "date"),
      col("overdue", "Days overdue", "number"),
    ],
    rows,
  };
};

/** The payment notices e-mailed to suppliers (سجل إشعارات السداد). */
export const paymentNotices = (store: Store): ReportData => ({
  columns: [col("at", "Paid", "date"), col("supplier", "Supplier"), col("email", "Notice sent to"), col("invoice", "Invoice"), col("method", "Method"), col("reference", "Reference"), col("amount", "Amount", "money"), col("sent", "Notice sent", "date")],
  rows: store.SupplierInvoices.flatMap((i) => {
    const supplier = store.Suppliers.find((s) => s.uuid === i.supplierUuid);
    return i.payments.map((p) => ({
      key: p.uuid,
      cells: {
        at: p.at,
        supplier: supplier?.name ?? "",
        email: supplier?.email ?? "",
        invoice: i.number,
        method: PAYMENT_METHOD_LABELS[p.method],
        reference: p.reference,
        amount: p.amount,
        sent: p.noticeSentAt,
      },
    }));
  }).sort((a, b) => String(b.cells.at).localeCompare(String(a.cells.at))),
});

/** Each subcontract order's balance: certified, still to do, advance, retention, materials (رصيد أمر الإسناد). */
export const subcontractBalances = (store: Store): ReportData => {
  const rows = store.Subcontracts.map((sc) => {
    const final = store.Extracts.filter((e) => e.subcontractUuid === sc.uuid && (e.status === "approved" || e.status === "paid"));
    const certified = round2(sumBy(final, (e) => e.gross));
    return {
      key: sc.uuid,
      cells: {
        number: sc.number,
        subcontractor: store.Subcontractors.find((s) => s.uuid === sc.subcontractorUuid)?.name ?? "",
        project: projectCode(store, sc.projectUuid),
        value: sc.value,
        certified,
        remaining: round2(sc.value - certified),
        advance: sc.advancePaid,
        recovered: round2(sumBy(final, (e) => e.advanceDeduction)),
        retention: round2(sumBy(final, (e) => e.retention)),
        materials: round2(sumBy(final, (e) => e.materialsDeduction)),
      },
    };
  });
  return {
    figures: [
      { label: "Certified", value: total(rows, "certified"), kind: "money" },
      { label: "Retention held", value: total(rows, "retention"), kind: "money" },
    ],
    columns: [
      col("number", "Subcontract"),
      col("subcontractor", "Subcontractor"),
      col("project", "Project"),
      col("value", "Order value", "money"),
      col("certified", "Certified", "money"),
      col("remaining", "Still to certify", "money"),
      col("advance", "Advance paid", "money"),
      col("recovered", "Advance recovered", "money"),
      col("retention", "Retention held", "money"),
      col("materials", "Materials deducted", "money"),
    ],
    rows,
  };
};

/** Materials issued to subcontractors, and how much was taken off their extracts. */
export const subcontractorMaterials = (store: Store): ReportData => {
  const rows = store.StockMovements.filter((m) => m.type === "issue" && m.chargedTo?.kind === "subcontractor").map((m) => ({
    key: m.uuid,
    cells: {
      at: m.at,
      subcontractor: m.chargedTo?.name ?? "",
      project: projectCode(store, m.projectUuid),
      item: store.Items.find((i) => i.uuid === m.itemUuid)?.name ?? "",
      qty: -m.qty,
      value: round2(-m.qty * m.unitCost),
      ref: m.refNumber,
    },
  }));
  const deducted = round2(sumBy(store.Extracts.filter((e) => e.status !== "rejected"), (e) => e.materialsDeduction));
  return {
    figures: [
      { label: "Issued to subcontractors", value: total(rows, "value"), kind: "money" },
      { label: "Deducted from extracts", value: deducted, kind: "money" },
    ],
    columns: [col("at", "Issued", "date"), col("subcontractor", "Subcontractor"), col("project", "Project"), col("item", "Item"), col("qty", "Qty", "number"), col("value", "Value", "money"), col("ref", "Issue note")],
    rows,
  };
};

// ─── Customers ───

/** Invoices and extracts still with the customer (المستخلصات المعلقة لدى العميل). */
export const pendingCustomerInvoices = (store: Store, _params: ReportParams, now: string): ReportData => {
  const rows = store.CustomerInvoices.filter((i) => !i.paidAt).map((i) => {
    const project = store.Projects.find((p) => p.uuid === i.projectUuid);
    return {
      key: i.uuid,
      cells: {
        number: i.number,
        project: project?.code ?? "",
        customer: project ? OPERATOR_LABELS[project.operator] : "",
        basis: i.basis.replace("_", "-").toUpperCase(),
        total: i.total,
        submitted: i.submittedAt,
        due: i.dueAt,
        overdue: i.dueAt < now ? Math.floor((new Date(now).getTime() - new Date(i.dueAt).getTime()) / DAY_MS) : null,
      },
    };
  });
  return {
    figures: [{ label: "With the customer", value: total(rows, "total"), kind: "money" }],
    columns: [col("number", "Invoice"), col("project", "Project"), col("customer", "Customer"), col("basis", "Basis"), col("total", "Total", "money"), col("submitted", "Submitted", "date"), col("due", "Due", "date"), col("overdue", "Days overdue", "number")],
    rows,
  };
};

/** A customer's statement (كشف حساب عميل): invoices against collections, with the running balance. */
export const customerStatement = (store: Store, params: ReportParams): ReportData => {
  const party = params.party === "stc" ? "stc" : "mobily";
  const projects = new Set(store.Projects.filter((p) => p.operator === party).map((p) => p.uuid));
  const lines = store.CustomerInvoices.filter((i) => projects.has(i.projectUuid))
    .flatMap((i) => [
      { at: i.submittedAt, ref: i.number, description: `Tax invoice — ${projectCode(store, i.projectUuid)}`, debit: i.total, credit: 0 },
      ...(i.paidAt ? [{ at: i.paidAt, ref: i.number, description: "Collection", debit: 0, credit: i.total }] : []),
    ])
    .sort((a, b) => a.at.localeCompare(b.at));
  let balance = 0;
  const rows = lines.map((l, index) => {
    balance = round2(balance + l.debit - l.credit);
    return { key: String(index), cells: { ...l, balance } };
  });
  return {
    choices: [{ param: "party", label: "Customer", options: [{ value: "mobily", label: "Mobily" }, { value: "stc", label: "STC" }], selected: party }],
    figures: [
      { label: "Invoiced", value: total(rows, "debit"), kind: "money" },
      { label: "Collected", value: total(rows, "credit"), kind: "money" },
      { label: "Balance due", value: balance, kind: "money" },
    ],
    columns: [col("at", "Date", "date"), col("ref", "Reference"), col("description", "Description", "text", true), col("debit", "Debit", "money"), col("credit", "Credit", "money"), col("balance", "Balance", "money")],
    rows,
  };
};

// ─── Budgets and cost ───

/** Open commitments (الالتزامات المفتوحة): ordered or contracted, not yet invoiced or certified. */
export const openCommitments = (store: Store): ReportData => {
  const pos = store.PurchaseOrders.filter((p) => !["cancelled", "rejected", "pending_approval"].includes(p.status)).map((po) => {
    const invoiced = round2(sumBy(store.SupplierInvoices.filter((i) => i.poUuid === po.uuid && i.status !== "rejected"), (i) => i.subtotal));
    return { key: po.uuid, cells: { kind: "Purchase order", number: po.number, project: projectCode(store, po.projectUuid), party: supplierName(store, po.supplierUuid), committed: po.subtotal, done: invoiced, open: round2(po.subtotal - invoiced) } };
  });
  const subs = store.Subcontracts.map((sc) => {
    const certified = round2(sumBy(store.Extracts.filter((e) => e.subcontractUuid === sc.uuid && (e.status === "approved" || e.status === "paid")), (e) => e.gross));
    return {
      key: sc.uuid,
      cells: {
        kind: "Subcontract",
        number: sc.number,
        project: projectCode(store, sc.projectUuid),
        party: store.Subcontractors.find((s) => s.uuid === sc.subcontractorUuid)?.name ?? "",
        committed: sc.value,
        done: certified,
        open: round2(sc.value - certified),
      },
    };
  });
  const rows = [...pos, ...subs].filter((r) => Number(r.cells.open) > 0.005);
  return {
    figures: [{ label: "Open commitments", value: total(rows, "open"), kind: "money" }],
    columns: [col("kind", "Kind"), col("number", "Document"), col("project", "Project"), col("party", "Supplier / subcontractor"), col("committed", "Committed", "money"), col("done", "Invoiced / certified", "money"), col("open", "Open", "money")],
    rows,
  };
};

/** Each project's profitability (ربحية كل مشروع): revenue invoiced against cost to date. */
export const projectProfitability = (store: Store, _params: ReportParams, now: string): ReportData => {
  const costs = projectCosts(store, now);
  const rows = store.Projects.map((p) => {
    const revenue = round2(sumBy(store.CustomerInvoices.filter((i) => i.projectUuid === p.uuid), (i) => i.amount));
    const cost = costs.get(p.uuid) ?? 0;
    const planned = round2(sumBy(store.ProjectBudgets.find((b) => b.projectUuid === p.uuid)?.lines ?? [], (l) => l.planned));
    return {
      key: p.uuid,
      href: `/projects/${p.uuid}`,
      cells: {
        project: p.code,
        name: p.name,
        contract: p.poValue,
        budget: planned,
        revenue,
        cost,
        margin: round2(revenue - cost),
        marginPct: revenue > 0 ? (revenue - cost) / revenue : null,
        plannedPct: p.poValue > 0 ? (p.poValue - planned) / p.poValue : null,
      },
    };
  });
  return {
    note: "Revenue is what has been invoiced (excl. VAT); cost to date is every cost charged to the project in the books plus its share of overhead.",
    figures: [
      { label: "Revenue invoiced", value: total(rows, "revenue"), kind: "money" },
      { label: "Cost to date", value: total(rows, "cost"), kind: "money" },
      { label: "Margin to date", value: total(rows, "margin"), kind: "money" },
    ],
    columns: [
      col("project", "Project"),
      col("name", "Name"),
      col("contract", "Contract value", "money"),
      col("budget", "Budget", "money"),
      col("revenue", "Revenue", "money"),
      col("cost", "Cost to date", "money"),
      col("margin", "Margin", "money"),
      col("marginPct", "Margin %", "percent"),
      col("plannedPct", "Planned margin %", "percent"),
    ],
    rows,
  };
};

/** Cost to date by budget category, per project (تكاليف المشروع حتى تاريخه). */
export const costToDate = (store: Store): ReportData => {
  const rows = store.Projects.map((p) => {
    const usage = budgetUsage(store, p.uuid);
    const cells: Record<string, string | number | null> = { project: p.code };
    for (const category of budgetCategories) {
      cells[category] = usage.find((u) => u.category === category)?.actual ?? 0;
    }
    cells.total = round2(sumBy(usage, (u) => u.actual));
    return { key: p.uuid, href: `/finance/budgets/${p.uuid}`, cells };
  });
  return {
    figures: [{ label: "Cost to date, all projects", value: total(rows, "total"), kind: "money" }],
    columns: [col("project", "Project"), ...budgetCategories.map((c) => col(c, BUDGET_CATEGORY_LABELS[c], "money")), col("total", "Total", "money")],
    rows,
  };
};

/** Budget overruns (تقرير التجاوزات عن الموازنة المعتمدة). */
export const budgetOverruns = (store: Store): ReportData => {
  const rows = store.ProjectBudgets.filter((b) => b.status === "approved").flatMap((b) =>
    budgetUsage(store, b.projectUuid)
      .filter((u) => u.reserved + u.committed + u.spent > u.planned + 0.005 || u.actual > u.planned + 0.005)
      .map((u) => {
        const consumed = round2(u.reserved + u.committed + u.spent);
        return {
          key: `${b.uuid}-${u.category}`,
          href: `/finance/budgets/${b.projectUuid}`,
          cells: {
            project: projectCode(store, b.projectUuid),
            category: BUDGET_CATEGORY_LABELS[u.category as BudgetCategory],
            planned: u.planned,
            consumed,
            actual: u.actual,
            over: round2(Math.max(consumed, u.actual) - u.planned),
          },
        };
      }),
  );
  return {
    note: rows.length === 0 ? "No approved budget line is overrun." : undefined,
    columns: [col("project", "Project"), col("category", "Category"), col("planned", "Planned", "money"), col("consumed", "Reserved + committed + spent", "money"), col("actual", "Actual", "money"), col("over", "Over by", "money")],
    rows,
  };
};

/** The cost-centre report (تقرير مراكز التكلفة): expenses, labour, depreciation and overhead per centre. */
export const costCentreReport = (store: Store, _params: ReportParams, now: string): ReportData => {
  const labour = laborCostByProject(store, bookedPayrollRuns(store));
  const ledger = journal(store, now).flatMap((e) => e.lines);
  const rows = costCenterOptions(store).map((c) => {
    const isProject = c.kind === "project";
    const expenses = round2(sumBy(store.Expenses.flatMap((e) => e.allocations), (a) => (a.costCenterUuid === c.uuid ? a.amount : 0)));
    const labourCost = isProject ? (labour.find((l) => l.projectUuid === c.uuid)?.amount ?? 0) : 0;
    const depreciation = isProject ? round2(sumBy(ledger, (l) => (l.account === "6100" && l.projectUuid === c.uuid ? l.debit : 0))) : 0;
    const overhead = isProject ? round2(sumBy(store.OverheadAllocations.flatMap((o) => o.lines), (l) => (l.projectUuid === c.uuid ? l.amount : 0))) : 0;
    return {
      key: c.uuid,
      cells: { code: c.code, name: c.name, kind: c.kind, expenses, labour: labourCost, depreciation, overhead, total: round2(expenses + labourCost + depreciation + overhead) },
    };
  });
  const headOffice = labour.find((l) => !l.projectUuid);
  if (headOffice) {
    rows.push({
      key: "head-office-labour",
      cells: { code: "HO", name: "Head office payroll", kind: "department", expenses: 0, labour: headOffice.amount, depreciation: 0, overhead: 0, total: headOffice.amount },
    });
  }
  return {
    columns: [col("code", "Cost centre"), col("name", "Name"), col("kind", "Kind"), col("expenses", "Expenses", "money"), col("labour", "Labour", "money"), col("depreciation", "Depreciation", "money"), col("overhead", "Overhead allocated", "money"), col("total", "Total", "money")],
    rows: rows.filter((r) => Number(r.cells.total) !== 0),
  };
};

// ─── Payroll and assets ───

/** Labour cost per project across every approved payroll (تقرير تكلفة العمالة لكل مشروع). */
export const labourCostReport = (store: Store): ReportData => {
  const runs = bookedPayrollRuns(store).sort((a, b) => a.period.localeCompare(b.period));
  const projects = laborCostByProject(store, runs);
  return {
    columns: [col("project", "Project"), col("name", "Name"), ...runs.map((r) => col(r.period, formatPeriod(r.period), "money")), col("days", "Person-days", "number"), col("total", "Total", "money")],
    rows: projects.map((p) => {
      const cells: Record<string, string | number | null> = { project: p.projectCode, name: p.projectName, days: p.days, total: p.amount };
      for (const run of runs) {
        cells[run.period] = laborCostByProject(store, [run]).find((x) => x.projectUuid === p.projectUuid)?.amount ?? 0;
      }
      return { key: p.projectUuid ?? "head-office", cells };
    }),
  };
};

/** Social insurance by month (التأمينات الاجتماعية). */
export const gosiReport = (store: Store): ReportData => ({
  columns: [col("period", "Month"), col("employees", "Employees", "number"), col("employee", "Employee share", "money"), col("employer", "Company share", "money"), col("total", "Total", "money"), col("status", "Payroll"), col("filed", "Paid to GOSI")],
  rows: [...store.PayrollRuns]
    .sort((a, b) => b.period.localeCompare(a.period))
    .map((r) => {
      const employee = round2(sumBy(r.payslips, (p) => p.gosiEmployee));
      const employer = round2(sumBy(r.payslips, (p) => p.gosiEmployer));
      const filing = store.TaxFilings.find((f) => f.kind === "gosi" && f.period === r.period);
      return {
        key: r.uuid,
        href: `/payroll/runs/${r.uuid}`,
        cells: { period: formatPeriod(r.period), employees: r.payslips.length, employee, employer, total: round2(employee + employer), status: r.status, filed: filing ? filing.reference : "Not yet" },
      };
    }),
});

/** The annual count of fixed assets (تقرير الجرد السنوي للأصول). */
export const assetCountReport = (store: Store, _params: ReportParams, now: string): ReportData => {
  const year = now.slice(0, 4);
  const active = store.FixedAssets.filter((a) => a.status === "active");
  const rows = active.map((a) => {
    const count = a.counts.find((c) => c.at.slice(0, 4) === year);
    return {
      key: a.uuid,
      href: `/finance/assets/${a.uuid}`,
      cells: {
        number: a.number,
        name: a.name,
        serial: a.serialNumber,
        holder: a.holder.kind === "employee" ? (a.holder.employeeName ?? "") : (store.Warehouses.find((w) => w.uuid === a.holder.warehouseUuid)?.code ?? ""),
        counted: count ? count.at : null,
        result: count ? (count.found ? "Found" : "Missing") : "Not counted",
        condition: count?.condition ?? "",
      },
    };
  });
  return {
    figures: [
      { label: `Counted in ${year}`, value: rows.filter((r) => r.cells.counted).length, kind: "number", hint: `of ${rows.length}` },
      { label: "Missing", value: rows.filter((r) => r.cells.result === "Missing").length, kind: "number" },
    ],
    columns: [col("number", "Asset"), col("name", "Name"), col("serial", "Serial"), col("holder", "Location / custodian"), col("counted", "Counted", "date"), col("result", "Result"), col("condition", "Condition", "text", true)],
    rows,
  };
};

// ─── Treasury ───

/** Actual cash flow by month (التدفقات النقدية الفعلية), every bank account together. */
export const cashFlowActual = (store: Store, _params: ReportParams, now: string): ReportData => {
  const movements = bankMovements(store);
  const periods = recentPeriods(6, now).reverse();
  const rows = periods.map((period) => {
    const mine = movements.filter((m) => m.at.slice(0, 7) === period && m.at >= (store.BankAccounts.find((a) => a.uuid === m.bankAccountUuid)?.openingDate ?? ""));
    const end = `${period}-31T23:59:59.999Z`;
    return {
      key: period,
      cells: {
        period: formatPeriod(period),
        in: round2(sumBy(mine.filter((m) => m.amount > 0), (m) => m.amount)),
        out: round2(-sumBy(mine.filter((m) => m.amount < 0), (m) => m.amount)),
        net: round2(sumBy(mine, (m) => m.amount)),
        closing: round2(sumBy(store.BankAccounts, (a) => balanceAt(a, end < now ? end : now, movements))),
      },
    };
  });
  return {
    columns: [col("period", "Month"), col("in", "Cash in", "money"), col("out", "Cash out", "money"), col("net", "Net", "money"), col("closing", "Closing balance", "money")],
    rows,
  };
};

/**
 * Expected cash flow for the next three months (التدفقات النقدية المتوقعة): what
 * customers owe by due date, what suppliers and subcontractors are owed, the
 * payroll at the last run's level, open POs at their payment terms.
 */
export const cashFlowExpected = (store: Store, _params: ReportParams, now: string): ReportData => {
  const months = recentPeriods(1, now).concat(
    [1, 2].map((i) => {
      const d = new Date(now);
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + i, 1)).toISOString().slice(0, 7);
    }),
  );
  const monthOf = (iso: string) => (iso.slice(0, 7) < months[0] ? months[0] : iso.slice(0, 7));
  const lastRun = [...store.PayrollRuns].sort((a, b) => b.period.localeCompare(a.period))[0];
  const payroll = lastRun ? round2(sumBy(lastRun.payslips, (p) => p.net + p.gosiEmployee + p.gosiEmployer)) : 0;
  let balance = round2(sumBy(store.BankAccounts, (a) => balanceAt(a, now, bankMovements(store))));
  const rows = months.map((month, index) => {
    const receipts = round2(sumBy(store.CustomerInvoices.filter((i) => !i.paidAt && monthOf(i.dueAt) === month), (i) => i.total));
    const suppliers = round2(
      sumBy(store.SupplierInvoices.filter((i) => (i.status === "approved" || i.status === "registered") && monthOf(i.dueDate) === month), (i) => i.netPayable - paidOf(i.payments)),
    );
    const extracts = index === 0 ? round2(sumBy(store.Extracts.filter((e) => e.status === "approved"), (e) => e.net)) : 0;
    const pos = round2(
      sumBy(
        store.PurchaseOrders.filter((p) => ["approved", "sent", "partially_received"].includes(p.status)),
        (p) => {
          const due = addDays(p.expectedDeliveryAt ?? addDays(now, p.deliveryDays), p.paymentTermsDays);
          const invoiced = sumBy(store.SupplierInvoices.filter((i) => i.poUuid === p.uuid && i.status !== "rejected"), (i) => i.total);
          return monthOf(due) === month ? Math.max(0, p.total - invoiced) : 0;
        },
      ),
    );
    const net = round2(receipts - suppliers - extracts - payroll - pos);
    balance = round2(balance + net);
    return { key: month, cells: { month: formatPeriod(month), receipts, suppliers, extracts, payroll, pos, net, balance } };
  });
  return {
    note: "Overdue amounts fall in the current month. Payroll repeats the last run, social insurance included.",
    columns: [
      col("month", "Month"),
      col("receipts", "From customers", "money"),
      col("suppliers", "To suppliers", "money"),
      col("extracts", "To subcontractors", "money"),
      col("payroll", "Payroll", "money"),
      col("pos", "Open POs", "money"),
      col("net", "Net", "money"),
      col("balance", "Projected balance", "money"),
    ],
    rows,
  };
};

/** Actual cash flow against the budget (التدفقات النقدية الفعلية مقابل الموازنة), per project. */
export const cashFlowVsBudget = (store: Store, _params: ReportParams, now: string): ReportData => {
  const costs = projectCosts(store, now);
  const rows = store.Projects.map((p) => {
    const budget = round2(sumBy(store.ProjectBudgets.find((b) => b.projectUuid === p.uuid)?.lines ?? [], (l) => l.planned));
    const collected = round2(sumBy(store.CustomerInvoices.filter((i) => i.projectUuid === p.uuid && i.paidAt), (i) => i.total));
    const spent = costs.get(p.uuid) ?? 0;
    return {
      key: p.uuid,
      cells: {
        project: p.code,
        contract: p.poValue,
        budget,
        spent,
        used: budget > 0 ? spent / budget : null,
        collected,
        position: round2(collected - spent),
      },
    };
  });
  return {
    note: "Spent is cost to date; collected is what customers have paid (VAT included). Position is collected less spent.",
    columns: [col("project", "Project"), col("contract", "Contract value", "money"), col("budget", "Budget", "money"), col("spent", "Spent to date", "money"), col("used", "Budget used", "percent"), col("collected", "Collected", "money"), col("position", "Cash position", "money")],
    rows,
  };
};
