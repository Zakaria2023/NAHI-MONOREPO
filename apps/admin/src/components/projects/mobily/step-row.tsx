import { MobilyStep } from "@/db/enum";
import { MOBILY_STEP_LABELS } from "@/db/label";
import { StepRecord } from "services";
import { FormAction } from "@/lib/action-result";
import { FormDialog } from "@/components/shared/form-dialog";
import { DoneMark } from "../done-mark";
import { LockedMark } from "../locked-mark";
import { StepRecordForm } from "./step-record-form";

type StepRowProps = {
  step: MobilyStep;
  record?: StepRecord;
  blocker?: string;
  action: FormAction;
};

/** A dated step: done (when, by whom), locked (by which rule), or open to record. */
export const StepRow = ({ step, record, blocker, action }: StepRowProps) => (
  <div className="grid grid-cols-1 gap-2 border-b border-hairline-soft pb-3 last:border-0 last:pb-0 md:grid-cols-12 md:gap-4">
    <span className="pt-1 text-sm text-ink md:col-span-4">{MOBILY_STEP_LABELS[step]}</span>
    <div className="md:col-span-8">
      {record ? (
        <DoneMark at={record.at} by={record.by} note={record.note} />
      ) : blocker ? (
        <LockedMark reason={blocker} />
      ) : (
        <FormDialog label="Record" title={MOBILY_STEP_LABELS[step]} description="The date it happened, and its reference" size="sm">
          <StepRecordForm action={action} step={step} />
        </FormDialog>
      )}
    </div>
  </div>
);
