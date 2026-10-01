export * from "./dates";
export * from "./money";
export * from "./nav";
export * from "./numbering";

export const generateUuid = (): string => globalThis.crypto.randomUUID();

export const sumBy = <T>(items: readonly T[], pick: (item: T) => number): number =>
  items.reduce((total, item) => total + pick(item), 0);

/** Groups by a string key, keeping the first-seen order of the keys. */
export const groupBy = <T>(
  items: readonly T[],
  key: (item: T) => string,
): Record<string, T[]> =>
  items.reduce<Record<string, T[]>>((groups, item) => {
    const k = key(item);
    (groups[k] ??= []).push(item);
    return groups;
  }, {});
