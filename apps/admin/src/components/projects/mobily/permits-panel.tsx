import { PermitView } from "services";
import { StatusPill, Table } from "ui";
import { daysUntil, formatDate } from "utils";
import { PERMIT_AUTHORITY_LABELS } from "@/db/label";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormAction } from "@/lib/action-result";
import { IssuePermitForm } from "./issue-permit-form";
import { PermitForm } from "./permit-form";

type PermitsPanelProps = {
  permits: PermitView[];
  addAction: FormAction;
  issueAction: FormAction;
  canRequest: boolean;
};

/** Rule 2: each permit with its expected duration and the end date worked out from it. */
export const PermitsPanel = ({ permits, addAction, issueAction, canRequest }: PermitsPanelProps) => (
  <div className="flex flex-col gap-4">
    <Table
      data={permits}
      rowKey={(p) => p.uuid}
      emptyMessage="No permit requested yet."
      columns={[
        { key: "authority", header: "Authority", render: (p) => <span className="font-medium">{PERMIT_AUTHORITY_LABELS[p.authority]}</span> },
        { key: "ref", header: "Reference", render: (p) => <span dir="ltr">{p.reference}</span> },
        { key: "requested", header: "Requested", render: (p) => formatDate(p.requestedAt) },
        { key: "duration", header: "Duration", render: (p) => `${p.durationDays} days` },
        {
          key: "expiry",
          header: "Expected end",
          render: (p) => {
            const days = daysUntil(p.expiresAt);
            return (
              <div className="flex flex-col gap-1">
                <span>{formatDate(p.expiresAt)}</span>
                {p.issuedAt && (
                  <StatusPill tone={days < 0 ? "danger" : days <= 7 ? "warning" : "success"}>
                    {days < 0 ? "Expired" : `${days} day(s) left`}
                  </StatusPill>
                )}
              </div>
            );
          },
        },
        {
          key: "status",
          header: "Status",
          render: (p) =>
            p.issuedAt ? (
              <StatusPill tone="success">Issued {formatDate(p.issuedAt)}</StatusPill>
            ) : (
              <FormDialog label="Mark issued" title="Permit issued" description={`${PERMIT_AUTHORITY_LABELS[p.authority]} · ${p.reference}`} size="sm">
                <IssuePermitForm action={issueAction} permitUuid={p.uuid} />
              </FormDialog>
            ),
        },
      ]}
    />
    <FormDialog
      label="Request permit"
      title="Request permit"
      description="Its expected duration sets the end date to watch"
      dialogSize="lg"
      blocker={canRequest ? null : "Permits are requested once the PO is received."}
    >
      <PermitForm action={addAction} />
    </FormDialog>
  </div>
);
