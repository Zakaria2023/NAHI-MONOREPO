import { round2 } from "utils";
import { FixedAsset } from "../../../../db/types";

// THE FIXED-ASSET RULES (finance §7).
//
// Straight-line depreciation, charged from the month the asset is bought: each
// month carries (cost − salvage) ÷ useful life, and the last month takes the
// rounding so the asset ends exactly at its salvage value. A disposed asset is
// charged up to the month it left the books, and nothing after.

export type ScheduleYear = {
  year: number;
  opening: number;
  charge: number;
  closing: number;
};

type Depreciable = Pick<FixedAsset, "purchaseDate" | "cost" | "salvageValue" | "usefulLifeMonths" | "disposal">;

/** "2026-09" → a month count, so two periods can be subtracted. */
const monthIndex = (period: string): number => {
  const [year, month] = period.split("-").map(Number);
  return year * 12 + (month - 1);
};

export const monthlyCharge = (asset: Depreciable): number =>
  round2((asset.cost - asset.salvageValue) / asset.usefulLifeMonths);

/** Months charged up to and including `period`, capped at the useful life and at the disposal month. */
export const monthsCharged = (asset: Depreciable, period: string): number => {
  const last = asset.disposal && asset.disposal.at.slice(0, 7) < period ? asset.disposal.at.slice(0, 7) : period;
  const months = monthIndex(last) - monthIndex(asset.purchaseDate.slice(0, 7)) + 1;
  return Math.max(0, Math.min(months, asset.usefulLifeMonths));
};

/** Depreciation accumulated by the end of `period`. */
export const accumulatedAt = (asset: Depreciable, period: string): number => {
  const months = monthsCharged(asset, period);
  return months >= asset.usefulLifeMonths ? round2(asset.cost - asset.salvageValue) : round2(monthlyCharge(asset) * months);
};

export const bookValueAt = (asset: Depreciable, period: string): number => round2(asset.cost - accumulatedAt(asset, period));

/** What `period` itself is charged — the line of that month's depreciation posting. */
export const chargeFor = (asset: Depreciable, period: string): number => {
  const [year, month] = period.split("-").map(Number);
  const previous = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 7);
  return round2(accumulatedAt(asset, period) - accumulatedAt(asset, previous));
};

/** The depreciation schedule, one row per calendar year of the asset's life. */
export const depreciationSchedule = (asset: Depreciable): ScheduleYear[] => {
  const first = Number(asset.purchaseDate.slice(0, 4));
  const lastMonth = monthIndex(asset.purchaseDate.slice(0, 7)) + asset.usefulLifeMonths - 1;
  const last = Math.floor(lastMonth / 12);
  return Array.from({ length: last - first + 1 }, (_, i) => {
    const year = first + i;
    const opening = i === 0 ? asset.cost : bookValueAt(asset, `${year - 1}-12`);
    const closing = bookValueAt(asset, `${year}-12`);
    return { year, opening, charge: round2(opening - closing), closing };
  });
};

/** Selling or scrapping: proceeds less the book value at that date. */
export const disposalGainLoss = (asset: Depreciable, at: string, proceeds: number): { bookValue: number; gainLoss: number } => {
  const bookValue = bookValueAt(asset, at.slice(0, 7));
  return { bookValue, gainLoss: round2(proceeds - bookValue) };
};
