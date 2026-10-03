import { beforeEach, describe, expect, it } from "vitest";
import { resetStore } from "../../../db";
import { getCompanyOverview } from "./overview";

beforeEach(() => resetStore());

describe("company overview", () => {
  it("covers every area of the system, each figure linking to its screen", async () => {
    const sections = await getCompanyOverview();
    expect(sections.map((s) => s.key)).toEqual(["tasks", "people", "projects", "procurement", "warehouse", "custody", "payables", "receivables", "treasury", "books"]);
    for (const section of sections) {
      expect(section.figures.length).toBeGreaterThan(0);
      expect(section.figures.every((f) => f.href.startsWith("/"))).toBe(true);
    }
  });

  it("flags a problem figure only when it is not zero", async () => {
    const figures = (await getCompanyOverview()).flatMap((s) => s.figures);
    expect(figures.filter((f) => f.value === 0).every((f) => f.tone === "neutral")).toBe(true);
    const tasks = (await getCompanyOverview())[0];
    expect(tasks.figures.find((f) => f.label === "Overdue")).toMatchObject({ tone: "danger" });
  });
});
