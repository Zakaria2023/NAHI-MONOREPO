import { CERTIFICATE_RECEIVED_STEP, MOBILY_CERTIFICATE_SPLIT, MobilyDetail } from "services";
import { StatusPill } from "ui";
import { daysUntil, formatDate, formatMoney, round2 } from "utils";
import { certificateKinds } from "@/db/enum";
import { CERTIFICATE_LABELS } from "@/db/label";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormAction } from "@/lib/action-result";
import { CollectionForm } from "../collection-form";
import { LockedMark } from "../locked-mark";
import { CertificateInvoiceForm } from "./certificate-invoice-form";

type CertificatesPanelProps = {
  detail: MobilyDetail;
  poValue: number;
  invoiceAction: FormAction;
  collectAction: (invoiceUuid: string) => FormAction;
};

/**
 * Rules 5–8 in one table: each certificate, when it came, its invoice on
 * I-Supplier and the payment 60 days after — the certificate → invoice →
 * expected payment link the finance team follows.
 */
export const CertificatesPanel = ({ detail, poValue, invoiceAction, collectAction }: CertificatesPanelProps) => (
  <div className="flex flex-col divide-y divide-hairline-soft rounded-control border border-hairline-soft">
    {certificateKinds.map((kind) => {
      const received = detail.steps[CERTIFICATE_RECEIVED_STEP[kind]];
      const invoice = detail.invoices.find((i) => i.basis === kind);
      const blocker = detail.invoiceBlockers[kind];
      return (
        <div key={kind} className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-12">
          <div className="flex flex-col gap-1 md:col-span-3">
            <span className="text-sm font-medium text-ink">{CERTIFICATE_LABELS[kind]} certificate</span>
            {received ? (
              <StatusPill tone="success">Received {formatDate(received.at)}</StatusPill>
            ) : (
              <StatusPill>Not received</StatusPill>
            )}
            {kind === "fac" && detail.facEligibleAt && !received && (
              <span className="text-xs text-muted">FAC opens {formatDate(detail.facEligibleAt)}</span>
            )}
          </div>
          <div className="md:col-span-9">
            {invoice ? (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-ink">
                    {invoice.number} · {formatMoney(invoice.total)}
                  </span>
                  <span className="text-xs text-muted">
                    Submitted {formatDate(invoice.submittedAt)} · due {formatDate(invoice.dueAt)}
                  </span>
                </div>
                {invoice.paidAt ? (
                  <StatusPill tone="success">Collected {formatDate(invoice.paidAt)}</StatusPill>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill tone={daysUntil(invoice.dueAt) < 0 ? "danger" : "warning"}>
                      {daysUntil(invoice.dueAt) < 0 ? `Overdue ${-daysUntil(invoice.dueAt)} day(s)` : `Due in ${daysUntil(invoice.dueAt)} day(s)`}
                    </StatusPill>
                    <FormDialog label="Mark collected" title="Payment collected" description={`${invoice.number} · ${formatMoney(invoice.total)}`} variant="success" size="sm">
                      <CollectionForm action={collectAction(invoice.uuid)} />
                    </FormDialog>
                  </div>
                )}
              </div>
            ) : blocker ? (
              <LockedMark reason={blocker} />
            ) : (
              <FormDialog
                label="Submit invoice"
                title={`${CERTIFICATE_LABELS[kind]} invoice`}
                description="Submitted on I-Supplier; payment is due 60 days after"
                variant="primary"
                size="sm"
              >
                <CertificateInvoiceForm action={invoiceAction} kind={kind} suggestedAmount={round2(poValue * MOBILY_CERTIFICATE_SPLIT[kind])} />
              </FormDialog>
            )}
          </div>
        </div>
      );
    })}
  </div>
);
