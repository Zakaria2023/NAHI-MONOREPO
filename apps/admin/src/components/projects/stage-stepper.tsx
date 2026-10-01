import { Check } from "lucide-react";

export type StepperStage = {
  key: string;
  label: string;
  state: "done" | "current" | "todo";
};

type StageStepperProps = {
  stages: StepperStage[];
};

const DOT = {
  done: "border-success bg-success text-white",
  current: "border-primary bg-primary-tint text-primary",
  todo: "border-hairline bg-surface text-faint",
};

/** The whole cycle at a glance: done, the stage the project is in, still to come. */
export const StageStepper = ({ stages }: StageStepperProps) => (
  <ol className="scrollbar-slim flex gap-0 overflow-x-auto rounded-card border border-hairline bg-surface px-4 py-4">
    {stages.map((stage, index) => (
      <li key={stage.key} className="flex min-w-28 flex-1 flex-col items-center gap-2 text-center">
        <div className="flex w-full items-center">
          <span className={`h-px flex-1 ${index === 0 ? "bg-transparent" : stage.state === "todo" ? "bg-hairline" : "bg-success"}`} />
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${DOT[stage.state]}`}>
            {stage.state === "done" ? <Check size={14} /> : index + 1}
          </span>
          <span className={`h-px flex-1 ${index === stages.length - 1 ? "bg-transparent" : stages[index + 1]?.state === "todo" ? "bg-hairline" : "bg-success"}`} />
        </div>
        <span className={`px-1 text-xs ${stage.state === "current" ? "font-medium text-primary" : stage.state === "done" ? "text-ink" : "text-muted"}`}>
          {stage.label}
        </span>
      </li>
    ))}
  </ol>
);
