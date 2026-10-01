/** The row with `uuid`, or a thrown error naming what was missing. */
export const findOrThrow = <T extends { uuid: string }>(
  rows: T[],
  uuid: string,
  what: string,
): T => {
  const row = rows.find((r) => r.uuid === uuid);
  if (!row) {
    throw new Error(`${what} not found`);
  }
  return row;
};

export const assertRole = <R extends string>(
  role: R,
  allowed: readonly R[],
  action: string,
): void => {
  if (!allowed.includes(role)) {
    throw new Error(`Your role cannot ${action}`);
  }
};
