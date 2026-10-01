import { describe, expect, it } from "vitest";
import { compareSortKeys, sortKeyOf } from "./sort";

describe("table sort keys", () => {
  it("reads amounts and quantities as numbers", () => {
    expect(sortKeyOf("SAR 20,400.00")).toBe(20400);
    expect(sortKeyOf("12,000")).toBe(12000);
    expect(sortKeyOf("13.6%")).toBe(13.6);
  });

  it("reads dates as time, including the en-GB 'Sept'", () => {
    expect(sortKeyOf("09 Sept 2026")).toBe(Date.UTC(2026, 8, 9));
    expect(sortKeyOf("14 Aug 2026 Omar")).toBe(Date.UTC(2026, 7, 14));
  });

  it("treats a dash or an empty cell as nothing", () => {
    expect(sortKeyOf("—")).toBeNull();
    expect(sortKeyOf("  ")).toBeNull();
  });

  it("orders codes by their number, not character by character", () => {
    const codes = ["PR-0010", "PR-0002", "PR-0001"].map(sortKeyOf).sort(compareSortKeys);
    expect(codes).toEqual(["pr-0001", "pr-0002", "pr-0010"]);
    expect(compareSortKeys(2400, 16000)).toBeLessThan(0);
  });
});
