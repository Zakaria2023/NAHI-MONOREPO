import Link from "next/link";
import { ExtractRow } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { EXTRACT_STATUS_LABELS, STAFF_ROLE_LABELS } from "@/db/label";
import { EXTRACT_TONES } from "@/lib/status-tones";

type ExtractsTableProps = {
  extracts: ExtractRow[];
  emptyMessage: string;
};

export const ExtractsTable = ({ extracts, emptyMessage }: ExtractsTableProps) => (
  <Table
    data={extracts}
    rowKey={(e) => e.uuid}
    emptyMessage={emptyMessage}
    columns={[
      {
        key: "number",
        header: "Extract",
        render: (e) => (
          <div className="flex flex-col gap-0.5">
            <Link href={`/finance/extracts/${e.uuid}`} dir="ltr" className="font-medium after:absolute after:inset-0 hover:text-primary">
              {e.number}
            </Link>
            <span className="text-xs text-muted">{formatDate(e.createdAt)}</span>
          </div>
        ),
      },
      {
        key: "subcontractor",
        header: "Subcontractor",
        render: (e) => (
          <div className="flex flex-col gap-0.5">
            <span>{e.subcontractorName}</span>
            <span dir="ltr" className="text-xs text-muted">
              {e.subcontractNumber}
            </span>
          </div>
        ),
      },
      { key: "project", header: "Project", render: (e) => <span dir="ltr">{e.projectCode}</span> },
      {
        key: "period",
        header: "Period",
        render: (e) => (
          <span className="whitespace-nowrap">
            {formatDate(e.periodFrom)} – {formatDate(e.periodTo)}
          </span>
        ),
      },
      { key: "gross", header: "Gross", align: "end", render: (e) => formatMoney(e.gross) },
      { key: "net", header: "Net", align: "end", render: (e) => <span className="font-medium">{formatMoney(e.net)}</span> },
      { key: "status", header: "Status", render: (e) => <StatusPill tone={EXTRACT_TONES[e.status]}>{EXTRACT_STATUS_LABELS[e.status]}</StatusPill> },
      {
        key: "awaiting",
        header: "Awaiting",
        render: (e) => (e.awaiting ? STAFF_ROLE_LABELS[e.awaiting] : <span className="text-muted">—</span>),
      },
      {
        key: "via",
        header: "Submitted via",
        render: (e) => (
          <div className="flex flex-col items-start gap-1">
            <StatusPill tone={e.submittedVia === "portal" ? "info" : "neutral"}>{e.submittedVia === "portal" ? "Portal" : "Admin"}</StatusPill>
            <span className="text-xs text-muted">{e.submittedBy}</span>
          </div>
        ),
      },
    ]}
  />
);
