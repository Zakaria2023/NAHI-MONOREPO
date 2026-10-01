import { Check } from "lucide-react";

export type StepperStage = {
  key: string;
  label: string;
  state: "done" | "current" | "todo";
};

type StageStepperProps = {
  stages: StepperStage[];
};

const BAR = {
  done: "bg-success",
  current: "bg-primary",
  todo: "bg-hairline",
};

const LABEL = {
  done: "text-secondary",
  current: "font-medium text-primary",
  todo: "text-faint",
};

/** The whole cycle as one segmented track: done, the stage the project is in, still to come. */
export const StageStepper = ({ stages }: StageStepperProps) => (
  <div className="flex flex-col gap-5 rounded-card border border-hairline bg-surface p-6">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-base font-medium tracking-tight text-ink">Workflow</h2>
      <span className="text-sm text-muted">
        <span className="text-ink">{stages.filter((s) => s.state === "done").length}</span> of {stages.length} stages complete
      </span>
    </div>
    <ol className="scrollbar-slim flex gap-1.5 overflow-x-auto pb-1">
      {stages.map((stage, index) => (
        <li key={stage.key} className="flex min-w-24 flex-1 flex-col gap-2.5">
          <span className={`h-1.5 rounded-full ${BAR[stage.state]}`} />
          <span className={`flex flex-col gap-0.5 text-xs ${LABEL[stage.state]}`}>
            {stage.state === "done" ? <Check size={13} className="text-success" /> : <span className="tabular-nums">{index + 1}</span>}
            {stage.label}
          </span>
        </li>
      ))}
    </ol>
  </div>
);
