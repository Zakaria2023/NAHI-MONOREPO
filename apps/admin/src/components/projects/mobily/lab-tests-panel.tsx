import { LabTest } from "services";
import { StatusPill, Table } from "ui";
import { formatDate } from "utils";
import { LABORATORY_LABELS, LAB_TEST_STATUS_LABELS, LAB_TEST_SUBJECT_LABELS } from "@/db/label";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormAction } from "@/lib/action-result";
import { LAB_TONES } from "@/lib/status-tones";
import { LabResultForm } from "./lab-result-form";
import { LabTestForm } from "./lab-test-form";

type LabTestsPanelProps = {
  tests: LabTest[];
  addAction: FormAction;
  resultAction: FormAction;
};

/** Rule 3: every lab test's status, in Implementation. PAT waits for all of them. */
export const LabTestsPanel = ({ tests, addAction, resultAction }: LabTestsPanelProps) => (
  <div className="flex flex-col gap-3">
    <span className="text-sm font-medium text-ink">Laboratory tests</span>
    <Table
      data={tests}
      rowKey={(t) => t.uuid}
      emptyMessage="No lab test yet — PAT needs a passed test from both laboratories."
      columns={[
        { key: "lab", header: "Laboratory", render: (t) => LABORATORY_LABELS[t.lab] },
        { key: "subject", header: "Tests", render: (t) => LAB_TEST_SUBJECT_LABELS[t.subject] },
        {
          key: "status",
          header: "Status",
          render: (t) => (
            <div className="flex flex-col gap-1">
              <StatusPill tone={LAB_TONES[t.status]}>{LAB_TEST_STATUS_LABELS[t.status]}</StatusPill>
              {t.testedAt && <span className="text-xs text-muted">{formatDate(t.testedAt)}</span>}
            </div>
          ),
        },
        {
          key: "result",
          header: "Result",
          render: (t) =>
            t.status === "passed" ? (
              <span className="text-muted">—</span>
            ) : (
              <FormDialog label="Record result" title="Lab test result" description={`${LABORATORY_LABELS[t.lab]} · ${LAB_TEST_SUBJECT_LABELS[t.subject]}`} size="sm">
                <LabResultForm action={resultAction} testUuid={t.uuid} />
              </FormDialog>
            ),
        },
      ]}
    />
    <FormDialog label="Add lab test" title="Add lab test" description="PAT waits for a passed test from both laboratories">
      <LabTestForm action={addAction} />
    </FormDialog>
  </div>
);
