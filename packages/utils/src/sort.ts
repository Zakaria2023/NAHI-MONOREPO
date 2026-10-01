/** What a table cell sorts by: a number (amounts, quantities, dates as time), text, or nothing. */
export type SortKey = string | number | null;

/**
 * The sort key of a cell's visible text. "SAR 6,800.00" and "12,000" sort as
 * numbers, "14 Aug 2026" as a date, codes like "PR-0010" as text with their
 * digits compared numerically, and "—" or an empty cell as nothing.
 */
export const sortKeyOf = (text: string): SortKey => {
  const value = text.trim();
  if (value === "" || value === "—") {
    return null;
  }
  const date = /^(\d{1,2}) ([A-Za-z]{3,4}) (\d{4})/.exec(value);
  if (date) {
    const time = Date.parse(`${date[1]} ${date[2].slice(0, 3)} ${date[3]} UTC`);
    if (!Number.isNaN(time)) {
      return time;
    }
  }
  const amount = /^(?:SAR\s)?(-?[\d,]+(?:\.\d+)?)(?:\s|%|$)/.exec(value);
  if (amount) {
    return Number(amount[1].replace(/,/g, ""));
  }
  return value.toLowerCase();
};

/** Ascending order of two sort keys; text compares its digits as numbers. */
export const compareSortKeys = (a: SortKey, b: SortKey): number => {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b), "en", { numeric: true });
};
