import { nowIso, round2, sumBy } from "utils";
import { readStore } from "../../../db";
import { Store } from "../../../db/types";
import { AccountType, JournalEntry, LedgerAccount, chartOf, journal } from "./rules/ledger";

// THE BOOKS (finance §9, financial reports): trial balance, the ledger of each
// account, the income statement and the balance sheet — the final accounts —
// and the zakat estimate, all from the derived journal (rules/ledger.ts).

export type TrialBalanceRow = LedgerAccount & {
  debit: number;
  credit: number;
  /** In the account's natural direction: debit for assets and expenses, credit for the rest. */
  balance: number;
};

export type TrialBalance = {
  asOf: string;
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
};

export type LedgerLine = {
  key: string;
  at: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
};

export type AccountLedger = {
  account: LedgerAccount;
  lines: LedgerLine[];
  balance: number;
};

export type StatementSection = {
  title: string;
  rows: { code: string; name: string; amount: number }[];
  total: number;
};

export type IncomeStatement = {
  year: number;
  sections: StatementSection[];
  revenue: number;
  projectCosts: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
};

export type BalanceSheet = {
  asOf: string;
  assets: StatementSection;
  liabilities: StatementSection;
  equity: StatementSection;
  balanced: boolean;
};

export type ZakatEstimate = {
  year: number;
  equity: number;
  accumulatedProfit: number;
  netFixedAssets: number;
  base: number;
  netProfit: number;
  /** 2.5 % of the base, but never less than 2.5 % of the year's profit. */
  zakat: number;
};

/** Debit-natured accounts read debit − credit; the others credit − debit. */
const DEBIT_NATURE: AccountType[] = ["asset", "expense"];

const natural = (type: AccountType, debit: number, credit: number): number =>
  round2(DEBIT_NATURE.includes(type) ? debit - credit : credit - debit);

const totals = (entries: JournalEntry[]): Map<string, { debit: number; credit: number }> => {
  const map = new Map<string, { debit: number; credit: number }>();
  for (const line of entries.flatMap((e) => e.lines)) {
    const row = map.get(line.account) ?? { debit: 0, credit: 0 };
    map.set(line.account, { debit: row.debit + line.debit, credit: row.credit + line.credit });
  }
  return map;
};

export const trialBalanceOf = (store: Store, asOf: string): TrialBalance => {
  const sums = totals(journal(store, asOf));
  const rows = chartOf(store)
    .map((account) => {
      const sum = sums.get(account.code) ?? { debit: 0, credit: 0 };
      return { ...account, debit: round2(sum.debit), credit: round2(sum.credit), balance: natural(account.type, sum.debit, sum.credit) };
    })
    .filter((r) => r.debit !== 0 || r.credit !== 0);
  return {
    asOf,
    rows,
    totalDebit: round2(sumBy(rows, (r) => r.debit)),
    totalCredit: round2(sumBy(rows, (r) => r.credit)),
  };
};

const section = (title: string, rows: TrialBalanceRow[], pick: (r: TrialBalanceRow) => boolean): StatementSection => {
  const picked = rows.filter(pick).map((r) => ({ code: r.code, name: r.name, amount: r.balance }));
  return { title, rows: picked, total: round2(sumBy(picked, (r) => r.amount)) };
};

const profitOf = (store: Store, from: string, to: string): number => {
  const entries = journal(store, to).filter((e) => e.at >= from);
  const sums = totals(entries);
  return round2(
    sumBy(chartOf(store), (a) => {
      const s = sums.get(a.code) ?? { debit: 0, credit: 0 };
      return a.type === "revenue" ? s.credit - s.debit : a.type === "expense" ? -(s.debit - s.credit) : 0;
    }),
  );
};

export const trialBalance = async (asOf: string = nowIso()): Promise<TrialBalance> => trialBalanceOf(readStore(), asOf);

export const accountLedger = async (code: string): Promise<AccountLedger> => {
  const store = readStore();
  const account = chartOf(store).find((a) => a.code === code);
  if (!account) {
    throw new Error("Account not found");
  }
  let balance = 0;
  const lines = journal(store).flatMap((entry) =>
    entry.lines
      .filter((l) => l.account === code)
      .map((l, index) => {
        balance = round2(balance + natural(account.type, l.debit, l.credit));
        return { key: `${entry.key}-${index}`, at: entry.at, reference: entry.reference, description: entry.description, debit: l.debit, credit: l.credit, balance };
      }),
  );
  return { account, lines, balance };
};

export const ledgerAccounts = async (): Promise<LedgerAccount[]> => chartOf(readStore());

export const incomeStatement = async (year: number): Promise<IncomeStatement> => incomeStatementOf(readStore(), year, nowIso());

export const incomeStatementOf = (store: Store, year: number, now: string): IncomeStatement => {
  const to = `${year}-12-31T23:59:59.999Z` < now ? `${year}-12-31T23:59:59.999Z` : now;
  const entries = journal(store, to).filter((e) => e.at >= `${year}-01-01T00:00:00.000Z`);
  const sums = totals(entries);
  const rows = chartOf(store).map((account) => {
    const sum = sums.get(account.code) ?? { debit: 0, credit: 0 };
    return { ...account, debit: sum.debit, credit: sum.credit, balance: natural(account.type, sum.debit, sum.credit) };
  });
  const revenue = section("Revenue", rows, (r) => r.type === "revenue" && r.balance !== 0);
  const projectCosts = section("Cost of projects", rows, (r) => r.type === "expense" && r.code.startsWith("5") && r.balance !== 0);
  const operating = section("Operating expenses", rows, (r) => r.type === "expense" && r.code.startsWith("6") && r.balance !== 0);
  const grossProfit = round2(revenue.total - projectCosts.total);
  return {
    year,
    sections: [revenue, projectCosts, operating],
    revenue: revenue.total,
    projectCosts: projectCosts.total,
    grossProfit,
    operatingExpenses: operating.total,
    netProfit: round2(grossProfit - operating.total),
  };
};

export const balanceSheet = async (asOf: string = nowIso()): Promise<BalanceSheet> => balanceSheetOf(readStore(), asOf);

export const balanceSheetOf = (store: Store, asOf: string): BalanceSheet => {
  const tb = trialBalanceOf(store, asOf);
  const assets = section("Assets", tb.rows, (r) => r.type === "asset" && r.balance !== 0);
  const liabilities = section("Liabilities", tb.rows, (r) => r.type === "liability" && r.balance !== 0);
  const equityRows = tb.rows.filter((r) => r.type === "equity").map((r) => ({ code: r.code, name: r.name, amount: r.balance }));
  const profit = profitOf(store, "0000", asOf);
  const equity: StatementSection = {
    title: "Equity",
    rows: [...equityRows, { code: "3100", name: "Retained earnings (all profit to date)", amount: profit }],
    total: round2(sumBy(equityRows, (r) => r.amount) + profit),
  };
  return { asOf, assets, liabilities, equity, balanced: Math.abs(assets.total - liabilities.total - equity.total) < 0.05 };
};

/**
 * Zakat, estimated: 2.5 % of the zakat base (equity plus profit to date, less
 * net fixed assets), and never less than 2.5 % of the year's net profit. An
 * estimate for planning — the return itself is prepared with the adviser.
 */
export const zakatEstimate = async (year: number): Promise<ZakatEstimate> => zakatOf(readStore(), year, nowIso());

export const zakatOf = (store: Store, year: number, now: string): ZakatEstimate => {
  const asOf = `${year}-12-31T23:59:59.999Z` < now ? `${year}-12-31T23:59:59.999Z` : now;
  const tb = trialBalanceOf(store, asOf);
  const balanceOf = (code: string) => tb.rows.find((r) => r.code === code)?.balance ?? 0;
  const equity = balanceOf("3000");
  const accumulatedProfit = profitOf(store, "0000", asOf);
  const netFixedAssets = round2(balanceOf("1500") + balanceOf("1510"));
  const base = round2(equity + accumulatedProfit - netFixedAssets);
  const netProfit = profitOf(store, `${year}-01-01T00:00:00.000Z`, asOf);
  return {
    year,
    equity,
    accumulatedProfit,
    netFixedAssets,
    base,
    netProfit,
    zakat: round2(Math.max(base, netProfit, 0) * 0.025),
  };
};
