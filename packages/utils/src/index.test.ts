import { describe, expect, it } from "vitest";
import {
  activeNavHref,
  addYears,
  daysUntil,
  formatDuration,
  formatMoney,
  nextDocumentNumber,
  round2,
} from "./index";

describe("utils", () => {
  it("issues the next number after the highest one, not after the count", () => {
    expect(nextDocumentNumber("PR", [])).toBe("PR-0001");
    expect(nextDocumentNumber("PR", ["PR-0001", "PR-0007", "PO-0099"])).toBe("PR-0008");
  });

  it("lights only the deepest matching nav link", () => {
    const hrefs = ["/", "/projects", "/projects/new", "/procurement"];
    expect(activeNavHref("/projects/new", hrefs)).toBe("/projects/new");
    expect(activeNavHref("/projects/abc", hrefs)).toBe("/projects");
    expect(activeNavHref("/", hrefs)).toBe("/");
    expect(activeNavHref("/pro", hrefs)).toBeNull();
  });

  it("counts whole days and calendar years", () => {
    expect(daysUntil("2026-10-11T00:00:00.000Z", "2026-10-01T00:00:00.000Z")).toBe(10);
    expect(addYears("2026-03-15T00:00:00.000Z", 1)).toBe("2027-03-15T00:00:00.000Z");
  });

  it("formats money, rounding and durations", () => {
    expect(formatMoney(1234.5)).toBe("SAR 1,234.50");
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(formatDuration(23 * 3600000 + 5 * 60000)).toBe("23h 05m");
  });
});
