/**
 * The next document number in a series — `PR-0001`, `PO-0002`. Reads the
 * highest number already issued under the prefix rather than counting rows, so a
 * deleted or cancelled document never causes a number to be issued twice.
 */
export const nextDocumentNumber = (
  prefix: string,
  existing: readonly string[],
  digits: number = 4,
): string => {
  const highest = existing.reduce((max, number) => {
    if (!number.startsWith(`${prefix}-`)) {
      return max;
    }
    const value = Number.parseInt(number.slice(prefix.length + 1), 10);
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(digits, "0")}`;
};
