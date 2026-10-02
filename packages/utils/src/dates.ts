// Every stored timestamp is a full ISO string in UTC. Date-only inputs
// (`<input type="date">`) are converted at the edge with `fromDateInput` and
// `toDateInput`, so the store never holds two shapes of the same fact.

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export const nowIso = (): string => new Date().toISOString();

export const addDays = (iso: string, days: number): string =>
  new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();

export const addHours = (iso: string, hours: number): string =>
  new Date(new Date(iso).getTime() + hours * HOUR_MS).toISOString();

/** Calendar years, so 29 Feb + 1 year lands on 1 Mar as JavaScript dates do. */
export const addYears = (iso: string, years: number): string => {
  const date = new Date(iso);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return date.toISOString();
};

/** Whole days from `now` until `iso`; negative once it has passed. */
export const daysUntil = (iso: string, now: string = nowIso()): number =>
  Math.ceil((new Date(iso).getTime() - new Date(now).getTime()) / DAY_MS);

export const isPast = (iso: string, now: string = nowIso()): boolean =>
  new Date(iso).getTime() <= new Date(now).getTime();

export const formatDate = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

export const formatDateTime = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      })
    : "—";

/** "23h 05m" — the STC 24-hour countdown and anything else counted in hours. */
export const formatDuration = (ms: number): string => {
  const safe = Math.max(0, ms);
  const hours = Math.floor(safe / HOUR_MS);
  const minutes = Math.floor((safe % HOUR_MS) / 60000);
  if (hours >= 48) {
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
};

export const toDateInput = (iso: string | null | undefined): string =>
  iso ? iso.slice(0, 10) : "";

export const fromDateInput = (value: string): string =>
  new Date(`${value}T00:00:00.000Z`).toISOString();

/** "2026-09" — the key a monthly closing period is stored under. */
export const periodOf = (iso: string): string => iso.slice(0, 7);

/**
 * A form's date ("2026-10-01") or a full ISO timestamp, as an ISO timestamp.
 * Services take either, so an action can pass a date field straight through.
 */
export const toIso = (value: string): string =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value).toISOString();

/** "16 Oct 2026 (in 15 days)" / "(3 days ago)"; a dash when there is no date. */
export const formatRelativeDate = (iso: string | null | undefined, now: string = nowIso()): string => {
  if (!iso) {
    return "—";
  }
  const days = daysUntil(iso, now);
  return `${formatDate(iso)} (${days < 0 ? `${-days} days ago` : days === 0 ? "today" : `in ${days} days`})`;
};

/** "Good morning" / "Good afternoon" / "Good evening" for the hour in Riyadh. */
export const greetingFor = (iso: string = nowIso()): string => {
  const hour = Number(
    new Date(iso).toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Riyadh" }),
  );
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
};

/** "2026-09" → "Sept 2026". */
export const formatPeriod = (period: string): string =>
  new Date(`${period}-01T00:00:00.000Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

/** This month and the `count − 1` before it, newest first, as "2026-09" keys. */
export const recentPeriods = (count: number, now: string = nowIso()): string[] => {
  const d = new Date(now);
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1)).toISOString().slice(0, 7),
  );
};
