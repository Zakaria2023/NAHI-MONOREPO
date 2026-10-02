import { beforeEach, describe, expect, it } from "vitest";
import { resetStore } from "../../../db";
import { REPORTS, getReport, listReports } from "./reports/catalogue";

beforeEach(() => resetStore());

describe("the reports catalogue (finance §9, procurement §6)", () => {
  it("gives every report either a builder or the screen that is the report", async () => {
    const reports = await listReports();
    expect(reports.every((r) => r.built || r.href)).toBe(true);
    expect(new Set(reports.map((r) => r.slug)).size).toBe(reports.length);
  });

  it("builds every report on the demo data, each row filling every column under a unique key", async () => {
    for (const entry of REPORTS.filter((r) => r.build)) {
      const report = await getReport(entry.slug);
      expect(report, entry.slug).not.toBeNull();
      const keys = report?.rows.map((r) => r.key) ?? [];
      expect(new Set(keys).size, entry.slug).toBe(keys.length);
      for (const row of report?.rows ?? []) {
        for (const column of report?.columns ?? []) {
          expect(column.key in row.cells, `${entry.slug}: ${column.key}`).toBe(true);
        }
      }
    }
  });

  it("follows the choices it offers", async () => {
    const stc = await getReport("customer-statement", { party: "stc" });
    expect(stc?.choices?.[0].selected).toBe("stc");
    const ledger = await getReport("general-ledger", { account: "1200" });
    expect(ledger?.choices?.[0].selected).toBe("1200");
    expect(ledger?.rows.length).toBeGreaterThan(0);
  });
});
