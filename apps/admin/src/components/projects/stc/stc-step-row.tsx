import { StepRecord } from "services";
import { StcM3Check, StcPatStep } from "@/db/enum";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormAction } from "@/lib/action-result";
import { DoneMark } from "../done-mark";
import { LockedMark } from "../locked-mark";
import { StcStepForm } from "./stc-step-form";

type StcStepRowProps = {
  step: StcPatStep | StcM3Check;
  label: string;
  index?: number;
  record?: StepRecord;
  blocker?: string;
  action: FormAction;
};

export const StcStepRow = ({ step, label, index, record, blocker, action }: StcStepRowProps) => (
  <div className="grid grid-cols-1 gap-2 border-b border-hairline-soft pb-3 last:border-0 last:pb-0 md:grid-cols-12 md:gap-4">
    <span className="flex gap-2 pt-1 text-sm text-ink md:col-span-5">
      {index !== undefined && <span className="text-muted">{index}.</span>}
      {label}
    </span>
    <div className="md:col-span-7">
      {record ? (
        <DoneMark at={record.at} by={record.by} />
      ) : blocker ? (
        <LockedMark reason={blocker} />
      ) : (
        <FormDialog label="Record" title={label} description="The date it was done" size="sm">
          <StcStepForm action={action} step={step} />
        </FormDialog>
      )}
    </div>
  </div>
);
