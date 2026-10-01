import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "db/**/*.test.ts"],
    // Every test runs against an in-memory store, never .data/store.json — a
    // test that wrote the demo file would leave the admin showing its leftovers.
    env: { ERP_DATA_FILE: ":memory:" },
  },
});
