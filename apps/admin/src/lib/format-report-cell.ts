import { ReportCell, ReportColumnKind } from "services";
import { formatDate, formatMoney, formatNumber, formatPercent } from "utils";

/** A report cell as the reader sees it: money with SAR, dates spelled out, ratios as percentages. */
export const formatReportCell = (value: ReportCell, kind: ReportColumnKind): string => {
  if (value === null || value === "") {
    return "—";
  }
  if (typeof value === "string") {
    return kind === "date" ? formatDate(value) : value;
  }
  if (kind === "money") {
    return formatMoney(value);
  }
  if (kind === "percent") {
    return formatPercent(value);
  }
  return formatNumber(value);
};
