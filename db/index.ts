import fs from "node:fs";
import path from "node:path";
import { buildSeed } from "./seed";
import { Store } from "./types";

// THE MVP'S DATABASE: every table in one JSON file.
//
// It stands where MySQL + Drizzle will stand, behind the only two calls the
// services make — `readStore()` and `transact()` — so moving to a real database
// changes this file and nothing that imports it.
//
// One file at the repo root rather than memory in each process, because the
// admin and the portal are two Next.js servers: a change made in one has to be
// visible in the other, which is the whole point of the portal.
//
// `transact` re-reads the file, applies the change and writes it back through a
// temp file and a rename, so a reader never sees half a write. Node runs one
// synchronous transaction at a time per process; two processes writing in the
// same instant could still lose one write, which is acceptable for a demo store
// and is exactly what the real database's row locks will remove.

export type { Store } from "./types";

const MEMORY = ":memory:";
const RENAME_RETRIES = 5;

let memoryStore: Store | null = null;

const findRepoRoot = (): string => {
  let dir = process.cwd();
  while (!fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
    const parent = path.dirname(dir);
    if (parent === dir) {
      return process.cwd();
    }
    dir = parent;
  }
  return dir;
};

const dataFile = (): string =>
  process.env.ERP_DATA_FILE ?? path.join(findRepoRoot(), ".data", "store.json");

const isMemory = (): boolean => dataFile() === MEMORY;

/** Tables added to the schema after a store file was written start empty. */
const withAllTables = (partial: Partial<Store>): Store => {
  const empty = buildSeed(new Date().toISOString(), { empty: true });
  return { ...empty, ...partial };
};

const writeFile = (store: Store): void => {
  const file = dataFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(store, null, 2));
  // Windows refuses a rename onto a file another process has open for reading
  // for a moment; retry rather than fail the user's action.
  for (let attempt = 1; ; attempt++) {
    try {
      fs.renameSync(temp, file);
      return;
    } catch (error) {
      if (attempt >= RENAME_RETRIES) {
        throw error;
      }
    }
  }
};

const load = (): Store => {
  if (isMemory()) {
    memoryStore ??= buildSeed(new Date().toISOString());
    return structuredClone(memoryStore);
  }
  const file = dataFile();
  if (!fs.existsSync(file)) {
    const seed = buildSeed(new Date().toISOString());
    writeFile(seed);
    return seed;
  }
  const parsed: unknown = JSON.parse(fs.readFileSync(file, "utf8"));
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`Store file is not an object: ${file}`);
  }
  return withAllTables(parsed as Partial<Store>);
};

/** A private copy of the whole store. Mutating it changes nothing. */
export const readStore = (): Store => load();

/**
 * The one way to write. `change` gets a fresh copy, mutates it, and whatever it
 * returns is returned. If it throws, nothing is written.
 */
export const transact = <T>(change: (store: Store) => T): T => {
  const store = load();
  const result = change(store);
  if (isMemory()) {
    memoryStore = store;
  } else {
    writeFile(store);
  }
  return result;
};

/** Replaces everything with the seed (or `store`). Tests and "Reset demo data". */
export const resetStore = (store?: Store): void => {
  const next = store ?? buildSeed(new Date().toISOString());
  if (isMemory()) {
    memoryStore = structuredClone(next);
  } else {
    writeFile(next);
  }
};
