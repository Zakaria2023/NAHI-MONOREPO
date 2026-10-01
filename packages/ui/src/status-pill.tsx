import { ReactNode } from "react";

export type PillTone = "neutral" | "info" | "success" | "warning" | "danger";

type StatusPillProps = {
  tone?: PillTone;
  children: ReactNode;
};

const TONE_CLASSES: Record<PillTone, string> = {
  neutral: "border-hairline bg-hover text-secondary",
  info: "border-primary-tint-border bg-primary-tint text-primary",
  success: "border-success-tint bg-success-tint text-success",
  warning: "border-warning-tint bg-warning-tint text-warning",
  danger: "border-danger-tint bg-danger-tint text-danger",
};

export const StatusPill = ({ tone = "neutral", children }: StatusPillProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONE_CLASSES[tone]}`}
  >
    {children}
  </span>
);
