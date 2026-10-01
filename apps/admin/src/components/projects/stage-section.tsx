import { ChevronDown } from "lucide-react";
import { ReactNode } from "react";
import { StatusPill } from "ui";

type StageSectionProps = {
  index: number;
  title: string;
  state: "done" | "current" | "todo";
  summary?: string;
  children: ReactNode;
};

const PILL = {
  done: <StatusPill tone="success">Complete</StatusPill>,
  current: <StatusPill tone="info">Current stage</StatusPill>,
  todo: <StatusPill>Not started</StatusPill>,
};

/** One stage of a workflow; the current one opens by itself. */
export const StageSection = ({ index, title, state, summary, children }: StageSectionProps) => (
  <details open={state === "current"} className="group rounded-card border border-hairline bg-surface open:border-primary-tint-border">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-hover text-xs text-secondary">{index}</span>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-ink">{title}</span>
          {summary && <span className="text-xs text-muted">{summary}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {PILL[state]}
        <ChevronDown size={16} className="text-muted transition-transform group-open:rotate-180" />
      </div>
    </summary>
    <div className="flex flex-col gap-4 border-t border-hairline-soft px-5 py-4">{children}</div>
  </details>
);
