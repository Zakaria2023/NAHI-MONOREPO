import { StcDetail } from "services";
import { formatDate, formatDateTime } from "utils";
import { FactList } from "@/components/shared/fact-list";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormAction } from "@/lib/action-result";
import { Countdown } from "./countdown";
import { DesignForm } from "./design-form";

type DesignPanelProps = {
  detail: StcDetail;
  designAction: FormAction;
};

export const DesignPanel = ({ detail, designAction }: DesignPanelProps) => {
  const wf = detail.workflow;
  return (
    <div className="flex flex-col gap-4">
      {wf.designEndDate ? (
        <FactList
          columns={3}
          facts={[
            { label: "Closed in ISOW", value: formatDate(wf.designClosedAt) },
            { label: "End Date (STC approved the design)", value: formatDateTime(wf.designEndDate) },
            { label: "M2 opens", value: formatDateTime(detail.designWaitEndsAt) },
          ]}
        />
      ) : (
        <FormDialog label="Record design approval" title="Design approval" description="Closed in ISOW, and the End Date STC approved it on — M2 opens 24 hours after" variant="primary">
          <DesignForm action={designAction} />
        </FormDialog>
      )}
      {wf.stage === "design" && detail.designWaitEndsAt && <Countdown target={detail.designWaitEndsAt} />}
    </div>
  );
};
