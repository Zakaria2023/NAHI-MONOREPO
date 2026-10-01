import Link from "next/link";
import { listWarehouseDocuments, WarehouseDocRow } from "services";
import { PillTone, StatusPill, Table } from "ui";
import { formatDate } from "utils";
import { ENTITY_KIND_LABELS, ISSUE_REQUEST_STATUS_LABELS, STAFF_ROLE_LABELS, WAREHOUSE_DOC_STATUS_LABELS } from "@/db/label";
import { entityHref } from "@/lib/entity-href";
import { ISSUE_TONES, WAREHOUSE_DOC_TONES } from "@/lib/status-tones";

type DocumentsTableProps = {
  kind?: WarehouseDocRow["kind"];
};

const ISSUE_LABELS: Record<string, string> = ISSUE_REQUEST_STATUS_LABELS;
const DOC_LABELS: Record<string, string> = WAREHOUSE_DOC_STATUS_LABELS;
const ISSUE_PILLS: Record<string, PillTone> = ISSUE_TONES;
const DOC_PILLS: Record<string, PillTone> = WAREHOUSE_DOC_TONES;

/** Issue requests, transfers, stocktakes and write-offs in one register, newest first. */
export const DocumentsTable = async ({ kind }: DocumentsTableProps) => {
  const rows = (await listWarehouseDocuments()).filter((r) => !kind || r.kind === kind);
  return (
    <Table
      data={rows}
      rowKey={(r) => r.uuid}
      emptyMessage="No document of this kind yet — create one with the buttons above."
      columns={[
        {
          key: "number",
          header: "Number",
          render: (r) => (
            <Link href={entityHref(r.kind, r.uuid)} className="font-medium after:absolute after:inset-0 hover:text-primary" dir="ltr">
              {r.number}
            </Link>
          ),
        },
        { key: "kind", header: "Document", render: (r) => <span className="text-secondary">{ENTITY_KIND_LABELS[r.kind]}</span> },
        { key: "summary", header: "Summary", render: (r) => <span className="line-clamp-2">{r.summary}</span> },
        { key: "date", header: "Date", render: (r) => <span className="whitespace-nowrap">{r.createdAt ? formatDate(r.createdAt) : "—"}</span> },
        {
          key: "status",
          header: "Status",
          render: (r) => {
            const issue = r.kind === "issue_request";
            return (
              <StatusPill tone={(issue ? ISSUE_PILLS : DOC_PILLS)[r.status] ?? "neutral"}>
                {(issue ? ISSUE_LABELS : DOC_LABELS)[r.status] ?? r.status}
              </StatusPill>
            );
          },
        },
        {
          key: "awaiting",
          header: "Awaiting",
          render: (r) => (r.awaiting ? STAFF_ROLE_LABELS[r.awaiting] : <span className="text-muted">—</span>),
        },
      ]}
    />
  );
};
