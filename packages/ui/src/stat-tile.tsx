import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";

export type StatTone = "primary" | "success" | "warning" | "danger" | "teal" | "violet";

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  /** The colour of the icon chip — one hue per kind of figure. */
  tone?: StatTone;
  /** Where the figure comes from: the whole tile opens it. */
  href?: string;
};

const CHIP_CLASSES: Record<StatTone, string> = {
  primary: "bg-primary-tint text-primary",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  danger: "bg-danger-tint text-danger",
  teal: "bg-teal-tint text-teal",
  violet: "bg-violet-tint text-violet",
};

/** One cell of a stat strip: tiles sit edge to edge inside a `StatStrip`, split by hairlines. */
export const StatTile = ({ label, value, hint, icon, tone = "primary", href }: StatTileProps) => (
  <div className={`group relative flex flex-col gap-4 bg-surface p-6 transition-colors ${href ? "hover:bg-hover" : ""}`}>
    {href && <Link href={href} aria-label={`Open ${label}`} className="absolute inset-0" />}
    {href && (
      <ArrowUpRight
        size={16}
        className="absolute top-5 inset-e-5 text-faint opacity-0 transition-opacity group-hover:opacity-100"
      />
    )}
    <div className="flex items-center gap-2.5">
      {icon && <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${CHIP_CLASSES[tone]}`}>{icon}</span>}
      <span className="text-sm text-secondary">{label}</span>
    </div>
    <div className="flex flex-col gap-1">
      <span className="text-3xl font-medium tracking-tight whitespace-nowrap text-ink tabular-nums">{value}</span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  </div>
);
