import { PenLine } from "lucide-react";
import { IssueRequest } from "services";
import { formatDateTime } from "utils";

type IssueSignaturesProps = {
  request: IssueRequest;
};

/** The issue note's three signatures: the recipient, the storekeeper and the region PM who approved it. */
export const IssueSignatures = ({ request }: IssueSignaturesProps) => {
  const approver = request.approvals.find((a) => a.role === "region_project_manager" && a.decision === "approved");
  const signatures = [
    { role: "Recipient", name: request.signedByRecipient, at: request.issuedAt },
    { role: "Storekeeper", name: request.signedByKeeper, at: request.issuedAt },
    { role: "Region project manager", name: approver?.actorName, at: approver?.at },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {signatures.map((s) => (
        <div key={s.role} className="flex flex-col gap-2 rounded-control border border-hairline-soft px-4 py-3">
          <span className="text-xs text-muted">{s.role}</span>
          <span className="flex items-center gap-2 text-sm text-ink">
            <PenLine size={14} className="shrink-0 text-faint" />
            {s.name ?? "—"}
          </span>
          <span className="border-t border-dashed border-hairline pt-2 text-xs text-muted">{formatDateTime(s.at)}</span>
        </div>
      ))}
    </div>
  );
};
