/** Rounds to halalas. Every stored amount goes through this before it is saved. */
export const round2 = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const formatMoney = (amount: number, currency: string = "SAR"): string =>
  `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatNumber = (value: number): string =>
  value.toLocaleString("en-US", { maximumFractionDigits: 2 });

export const formatPercent = (ratio: number): string =>
  `${(ratio * 100).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
