import { ReactNode } from "react";

export type PillTone = "neutral" | "info" | "success" | "warning" | "danger";

type StatusPillProps = {
  tone?: PillTone;
  children: ReactNode;
};

const TONE_CLASSES: Record<PillTone, string> = {
  neutral: "bg-hover text-secondary ring-hairline",
  info: "bg-primary-tint text-primary ring-primary/20",
  success: "bg-success-tint text-success ring-success/20",
  warning: "bg-warning-tint text-warning ring-warning/25",
  danger: "bg-danger-tint text-danger ring-danger/20",
};

const DOT_CLASSES: Record<PillTone, string> = {
  neutral: "bg-faint",
  info: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export const StatusPill = ({ tone = "neutral", children }: StatusPillProps) => (
  <span
    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${TONE_CLASSES[tone]}`}
  >
    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASSES[tone]}`} />
    {children}
  </span>
);
