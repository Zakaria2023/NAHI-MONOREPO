import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { StcDocumentView } from "services";
import { StatusPill } from "ui";
import { formatDate } from "utils";
import { DOCUMENT_STATUS_LABELS, STC_DOCUMENT_LABELS, STC_PARTY_LABELS } from "@/db/label";
import { decideDocumentPartyAction, uploadDocumentAction } from "@/app/(dashboard)/projects/[uuid]/actions";
import { DOCUMENT_TONES } from "@/lib/status-tones";
import { PartyDecision } from "./party-decision";
import { UploadForm } from "./upload-form";

type DocumentsTableProps = {
  projectUuid: string;
  documents: StcDocumentView[];
  /** False while the project has not reached the documents' stage. */
  editable: boolean;
};

const REQUIREMENT = {
  required: <StatusPill tone="info">Mandatory</StatusPill>,
  later: <StatusPill>Can follow later</StatusPill>,
  conditional: <StatusPill tone="warning">If qty ↑ / new UPL</StatusPill>,
};

/** STC §6: each document, its responsible parties and their Pending / Approved / Rejected. */
export const DocumentsTable = ({ projectUuid, documents, editable }: DocumentsTableProps) => (
  <div className="flex flex-col divide-y divide-hairline-soft rounded-control border border-hairline-soft">
    {documents.map((view) => {
      const latest = (party: string) => [...view.doc.approvals].reverse().find((a) => a.party === party);
      return (
        <div key={view.key} className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-12">
          <div className="flex flex-col gap-1 md:col-span-4">
            <span className="text-sm font-medium text-ink">{STC_DOCUMENT_LABELS[view.key]}</span>
            <div className="flex flex-wrap gap-1.5">
              {REQUIREMENT[view.spec.requirement]}
              <StatusPill tone={DOCUMENT_TONES[view.status]}>{DOCUMENT_STATUS_LABELS[view.status]}</StatusPill>
            </div>
            {view.doc.fileName && (
              <span className="text-xs text-muted" dir="ltr">
                {view.doc.fileName} · {formatDate(view.doc.uploadedAt)}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-3">
            {view.spec.parties.map((party) => {
              const decision = latest(party);
              return (
                <span key={party} className="flex items-center gap-1.5 text-xs text-secondary">
                  {decision?.decision === "approved" && <CheckCircle2 size={14} className="text-success" />}
                  {decision?.decision === "rejected" && <XCircle size={14} className="text-danger" />}
                  {!decision && <Clock size={14} className="text-faint" />}
                  {STC_PARTY_LABELS[party]}
                  {decision?.note && <span className="text-muted">— {decision.note}</span>}
                </span>
              );
            })}
          </div>
          <div className="flex flex-col gap-2 md:col-span-5">
            {editable ? (
              <>
                {view.status !== "approved" && (
                  <UploadForm action={uploadDocumentAction.bind(null, projectUuid)} docKey={view.key} replacing={Boolean(view.doc.uploadedAt)} />
                )}
                {view.status === "pending" &&
                  view.awaiting
                    .filter((party) => latest(party)?.decision !== "rejected")
                    .map((party) => (
                      <PartyDecision key={party} party={party} action={decideDocumentPartyAction.bind(null, projectUuid, view.key, party)} />
                    ))}
              </>
            ) : (
              <span className="text-xs text-muted">Opens in its stage</span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);
