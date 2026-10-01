import { ReactNode } from "react";

export type StatTone = "primary" | "success" | "warning" | "danger" | "sky" | "violet";

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  /** The colour of the icon chip — one hue per kind of figure. */
  tone?: StatTone;
};

const CHIP_CLASSES: Record<StatTone, string> = {
  primary: "bg-primary-tint text-primary",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
  sky: "bg-sky-tint text-sky",
  violet: "bg-violet-tint text-violet",
};

export const StatTile = ({ label, value, hint, icon, tone = "primary" }: StatTileProps) => (
  <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5">
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted">{label}</span>
      {icon && <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${CHIP_CLASSES[tone]}`}>{icon}</div>}
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-2xl font-medium tracking-tight whitespace-nowrap text-ink tabular-nums">{value}</span>
      {hint && <span className="line-clamp-1 text-xs text-muted">{hint}</span>}
    </div>
  </div>
);
