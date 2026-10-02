import { beforeEach, describe, expect, it } from "vitest";
import { readStore, resetStore } from "../../../db";
import { listBankAccounts } from "./banking";
import { balanceSheet, incomeStatement, trialBalanceOf } from "./ledger";
import { bankAccountCode, journal } from "./rules/ledger";

beforeEach(() => resetStore());

describe("the derived general ledger (finance §9)", () => {
  it("writes every entry balanced, so the trial balance balances", () => {
    const store = readStore();
    const unbalanced = journal(store).filter(
      (e) => Math.abs(e.lines.reduce((sum, l) => sum + l.debit - l.credit, 0)) > 0.005,
    );
    expect(unbalanced.map((e) => e.key)).toEqual([]);
    const tb = trialBalanceOf(store, new Date().toISOString());
    expect(tb.totalDebit).toBeCloseTo(tb.totalCredit, 2);
  });

  it("agrees with the bank accounts' own balances", async () => {
    const store = readStore();
    const tb = trialBalanceOf(store, new Date().toISOString());
    for (const account of await listBankAccounts()) {
      expect(tb.rows.find((r) => r.code === bankAccountCode(account))?.balance ?? 0).toBeCloseTo(account.balance, 2);
    }
  });

  it("produces a balance sheet that balances, and a year's profit", async () => {
    expect((await balanceSheet()).balanced).toBe(true);
    const year = new Date().getUTCFullYear();
    const statement = await incomeStatement(year);
    expect(statement.netProfit).toBeCloseTo(statement.revenue - statement.projectCosts - statement.operatingExpenses, 2);
  });
});
