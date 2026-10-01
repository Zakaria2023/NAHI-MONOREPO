import { Check, ChevronDown } from "lucide-react";
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

const MARK = {
  done: "bg-success-tint text-success",
  current: "bg-primary text-white",
  todo: "bg-hover text-muted ring-1 ring-hairline ring-inset",
};

/** One stage of a workflow; the current one opens by itself. */
export const StageSection = ({ index, title, state, summary, children }: StageSectionProps) => (
  <details
    open={state === "current"}
    className={`group rounded-card border bg-surface transition-colors ${state === "current" ? "border-primary-tint-border" : "border-hairline"}`}
  >
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-card px-5 py-4 transition-colors hover:bg-hover group-open:rounded-b-none">
      <div className="flex items-center gap-4">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${MARK[state]}`}>
          {state === "done" ? <Check size={16} /> : index}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink">{title}</span>
          {summary && <span className="text-xs text-muted">{summary}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {PILL[state]}
        <ChevronDown size={16} className="text-muted transition-transform group-open:rotate-180" />
      </div>
    </summary>
    <div className="flex flex-col gap-4 border-t border-hairline-soft px-6 py-5">{children}</div>
  </details>
);
