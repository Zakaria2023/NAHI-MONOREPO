import Link from "next/link";
import { ActivityEntry } from "services";
import { StatusPill, Table } from "ui";
import { formatDateTime } from "utils";
import { ENTITY_KIND_LABELS } from "@/db/label";
import { entityHref } from "@/lib/entity-href";

type ActivityTableProps = {
  entries: ActivityEntry[];
  /** Hide the record column when the table sits on that record's own page. */
  showRecord?: boolean;
};

export const ActivityTable = ({ entries, showRecord = true }: ActivityTableProps) => (
  <Table
    data={entries}
    rowKey={(e) => e.uuid}
    emptyMessage="No activity yet."
    columns={[
      { key: "at", header: "When", render: (e) => <span className="whitespace-nowrap text-muted">{formatDateTime(e.at)}</span> },
      ...(showRecord
        ? [
            {
              key: "record",
              header: "Record",
              render: (e: ActivityEntry) => (
                <div className="flex items-center gap-2">
                  <Link href={entityHref(e.entity, e.entityUuid)} className="font-medium text-ink hover:text-primary">
                    {e.entityLabel}
                  </Link>
                  <StatusPill>{ENTITY_KIND_LABELS[e.entity]}</StatusPill>
                </div>
              ),
            },
          ]
        : []),
      {
        key: "action",
        header: "What happened",
        render: (e) => (
          <div className="flex flex-col">
            <span>{e.action}</span>
            {e.detail && <span className="text-xs text-muted">{e.detail}</span>}
          </div>
        ),
      },
      { key: "by", header: "By", render: (e) => <span className="text-secondary">{e.actorName}</span> },
    ]}
  />
);
