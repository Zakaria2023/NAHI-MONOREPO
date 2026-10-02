import { round2 } from "utils";
import { ENTITY_KIND_LABELS, STAFF_ROLE_LABELS } from "../../../../db/label";
import { Store } from "../../../../db/types";
import { pendingFor } from "../dashboard";
import { balanceSheetOf, incomeStatementOf, trialBalanceOf, zakatOf } from "../ledger";
import { chartOf, journal } from "../rules/ledger";
import { ReportData, ReportParams, ReportRow, col } from "./report";

// THE FINANCIAL STATEMENTS AND THE CONTROL REPORTS (finance §9, third and
// fourth groups): trial balance, ledgers, income statement, balance sheet,
// zakat — and exceptions, manual entries, data changes and late approvals.

const LATE_APPROVAL_DAYS = 3;

const TYPE_LABELS = { asset: "Asset", liability: "Liability", equity: "Equity", revenue: "Revenue", expense: "Expense" };
const DAY_MS = 24 * 60 * 60 * 1000;

const yearChoice = (now: string, selected: string) => {
  const year = Number(now.slice(0, 4));
  return {
    param: "year" as const,
    label: "Year",
    options: [year, year - 1].map((y) => ({ value: String(y), label: String(y) })),
    selected,
  };
};

export const trialBalanceReport = (store: Store, _params: ReportParams, now: string): ReportData => {
  const tb = trialBalanceOf(store, now);
  return {
    figures: [
      { label: "Total debits", value: tb.totalDebit, kind: "money" },
      { label: "Total credits", value: tb.totalCredit, kind: "money" },
      { label: "Difference", value: round2(tb.totalDebit - tb.totalCredit), kind: "money", hint: "Always zero: every entry balances" },
    ],
    columns: [col("code", "Account"), col("name", "Name"), col("type", "Type"), col("debit", "Debit", "money"), col("credit", "Credit", "money"), col("balance", "Balance", "money")],
    rows: [
      ...tb.rows.map((r) => ({
        key: r.code,
        href: `/reports/general-ledger?account=${r.code}`,
        cells: { code: r.code, name: r.name, type: TYPE_LABELS[r.type], debit: r.debit, credit: r.credit, balance: r.balance },
      })),
      { key: "total", emphasis: true, cells: { code: "", name: "Total", type: "", debit: tb.totalDebit, credit: tb.totalCredit, balance: null } },
    ],
  };
};

export const generalLedger = (store: Store, params: ReportParams, now: string): ReportData => {
  const chart = chartOf(store);
  const account = chart.find((a) => a.code === params.account) ?? chart[0];
  let balance = 0;
  const debitNature = account.type === "asset" || account.type === "expense";
  const rows = journal(store, now).flatMap((entry) =>
    entry.lines
      .filter((l) => l.account === account.code)
      .map((l, index) => {
        balance = round2(balance + (debitNature ? l.debit - l.credit : l.credit - l.debit));
        return {
          key: `${entry.key}-${index}`,
          cells: { at: entry.at, reference: entry.reference, description: entry.description, debit: l.debit, credit: l.credit, balance },
        };
      }),
  );
  return {
    choices: [{ param: "account", label: "Account", options: chart.map((a) => ({ value: a.code, label: `${a.code} — ${a.name}` })), selected: account.code }],
    figures: [{ label: `${account.code} — ${account.name}`, value: balance, kind: "money", hint: `${rows.length} entries` }],
    columns: [col("at", "Date", "date"), col("reference", "Reference"), col("description", "Description", "text", true), col("debit", "Debit", "money"), col("credit", "Credit", "money"), col("balance", "Balance", "money")],
    rows,
  };
};

export const incomeStatementReport = (store: Store, params: ReportParams, now: string): ReportData => {
  const year = Number(params.year ?? now.slice(0, 4));
  const statement = incomeStatementOf(store, year, now);
  const rows: ReportRow[] = statement.sections.flatMap((section) => [
    ...section.rows.map((r) => ({ key: r.code, href: `/reports/general-ledger?account=${r.code}`, cells: { line: `${r.code} — ${r.name}`, amount: r.amount } })),
    { key: `${section.title}-total`, emphasis: true, cells: { line: section.title, amount: section.total } },
  ]);
  rows.push({ key: "gross", emphasis: true, cells: { line: "Gross profit", amount: statement.grossProfit } });
  rows.push({ key: "net", emphasis: true, cells: { line: "Net profit", amount: statement.netProfit } });
  return {
    choices: [yearChoice(now, String(year))],
    figures: [
      { label: "Revenue", value: statement.revenue, kind: "money" },
      { label: "Gross profit", value: statement.grossProfit, kind: "money" },
      { label: "Net profit", value: statement.netProfit, kind: "money" },
    ],
    columns: [col("line", "Line"), col("amount", "Amount", "money")],
    rows,
  };
};

export const balanceSheetReport = (store: Store, _params: ReportParams, now: string): ReportData => {
  const sheet = balanceSheetOf(store, now);
  const rows: ReportRow[] = [sheet.assets, sheet.liabilities, sheet.equity].flatMap((section) => [
    ...section.rows.map((r) => ({ key: `${section.title}-${r.code}`, cells: { line: `${r.code} — ${r.name}`, amount: r.amount } })),
    { key: `${section.title}-total`, emphasis: true, cells: { line: `Total ${section.title.toLowerCase()}`, amount: section.total } },
  ]);
  return {
    figures: [
      { label: "Assets", value: sheet.assets.total, kind: "money" },
      { label: "Liabilities and equity", value: round2(sheet.liabilities.total + sheet.equity.total), kind: "money" },
      { label: "Balanced", value: sheet.balanced ? "Yes" : "No", kind: "text" },
    ],
    columns: [col("line", "Line"), col("amount", "Amount", "money")],
    rows,
  };
};

export const zakatReport = (store: Store, params: ReportParams, now: string): ReportData => {
  const year = Number(params.year ?? now.slice(0, 4));
  const z = zakatOf(store, year, now);
  return {
    choices: [yearChoice(now, String(year))],
    note: "An estimate for planning: 2.5 % of the zakat base (equity plus profit to date, less net fixed assets), never less than 2.5 % of the year's net profit. The return itself is prepared with the adviser.",
    figures: [{ label: `Zakat estimate ${year}`, value: z.zakat, kind: "money" }],
    columns: [col("line", "Line"), col("amount", "Amount", "money")],
    rows: [
      { key: "equity", cells: { line: "Owners' equity and opening balances", amount: z.equity } },
      { key: "profit", cells: { line: "Add: profit to date", amount: z.accumulatedProfit } },
      { key: "fixed", cells: { line: "Less: net fixed assets", amount: -z.netFixedAssets } },
      { key: "base", emphasis: true, cells: { line: "Zakat base", amount: z.base } },
      { key: "year", cells: { line: `Net profit ${year}`, amount: z.netProfit } },
      { key: "zakat", emphasis: true, cells: { line: "Zakat at 2.5 %", amount: z.zakat } },
    ],
  };
};

// ─── Control ───

const fromActivity = (store: Store, pattern: RegExp) =>
  store.Activity.filter((a) => pattern.test(a.action) || pattern.test(a.detail ?? "")).map((a) => ({
    key: a.uuid,
    cells: { at: a.at, record: `${ENTITY_KIND_LABELS[a.entity]} ${a.entityLabel}`, action: a.action, detail: a.detail ?? "", by: a.actorName },
  }));

const ACTIVITY_COLUMNS = [col("at", "When", "date"), col("record", "Record"), col("action", "What happened"), col("detail", "Detail", "text", true), col("by", "By")];

/** Exceptions and overrides (الاستثناءات والتجاوزات): every refusal, rejection, bounce and difference. */
export const exceptionsReport = (store: Store): ReportData => ({
  note: "Rejections, automatic rejections, bounced cheques, statement and stock differences, write-offs and payroll returned for correction, from the audit log.",
  columns: ACTIVITY_COLUMNS,
  rows: fromActivity(store, /reject|bounce|difference|returned for correction|written off|missing|overdue/i),
});

/** Manual entries (القيود اليدوية): every manual expense, with its cost centres. */
export const manualEntries = (store: Store): ReportData => ({
  columns: [col("at", "Date", "date"), col("number", "Entry"), col("description", "Description", "text", true), col("amount", "Amount", "money"), col("vat", "VAT", "money"), col("centres", "Cost centres", "text", true), col("by", "Entered by")],
  rows: [...store.Expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((e) => ({
      key: e.uuid,
      cells: {
        at: e.date,
        number: e.number,
        description: e.description,
        amount: e.amount,
        vat: e.vat,
        centres: e.allocations
          .map((a) => `${store.CostCenters.find((c) => c.uuid === a.costCenterUuid)?.code ?? store.Projects.find((p) => p.uuid === a.costCenterUuid)?.code ?? "?"} ${a.amount}`)
          .join(" · "),
        by: e.createdBy,
      },
    })),
});

/** Data changes (تعديلات البيانات): modified POs, revised budgets, updated timesheets, recalculations. */
export const dataChanges = (store: Store): ReportData => ({
  columns: ACTIVITY_COLUMNS,
  rows: fromActivity(store, /modif|revis|updated|recalculat|penalty terms|cancel|transferred|study (line|applied)|timeline row/i),
});

/** Late approvals (الاعتمادات المتأخرة): what has waited more than three days for its approver. */
export const lateApprovals = (store: Store, _params: ReportParams, now: string): ReportData => {
  const waitingSince = (uuid: string) =>
    store.Activity.filter((a) => a.entityUuid === uuid)
      .map((a) => a.at)
      .sort()
      .at(-1);
  const rows = pendingFor(store, "system_admin")
    .map((p) => {
      const since = waitingSince(p.uuid) ?? now;
      return {
        key: `${p.kind}-${p.uuid}-${p.step}`,
        cells: {
          number: p.number,
          kind: ENTITY_KIND_LABELS[p.kind],
          step: p.step,
          waitingFor: STAFF_ROLE_LABELS[p.waitingFor],
          since,
          days: Math.floor((new Date(now).getTime() - new Date(since).getTime()) / DAY_MS),
        },
      };
    })
    .filter((r) => r.cells.days > LATE_APPROVAL_DAYS)
    .sort((a, b) => b.cells.days - a.cells.days);
  return {
    note: `Every step that has waited more than ${LATE_APPROVAL_DAYS} days since the record last moved.`,
    figures: [{ label: "Late approvals", value: rows.length, kind: "number" }],
    columns: [col("number", "Record"), col("kind", "Kind"), col("step", "Step"), col("waitingFor", "Waiting for"), col("since", "Since", "date"), col("days", "Days waiting", "number")],
    rows,
  };
};
