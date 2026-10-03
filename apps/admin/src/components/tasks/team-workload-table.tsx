import Link from "next/link";
import { listTaskWorkload } from "services";
import { StatusPill, Table } from "ui";
import { STAFF_ROLE_LABELS } from "@/db/label";

/** Every staff member's tasks, counted: who carries what, who is late, who finishes on time. */
export const TeamWorkloadTable = async () => {
  const rows = await listTaskWorkload();
  return (
    <Table
      data={rows}
      rowKey={(r) => r.uuid}
      pageSize={20}
      emptyMessage="No staff yet."
      columns={[
        {
          key: "name",
          header: "Employee",
          render: (r) => (
            <div className="flex flex-col">
              <Link href={`/tasks?view=all&assignee=${r.uuid}`} className="font-medium text-ink after:absolute after:inset-0 hover:text-primary">
                {r.name}
              </Link>
              <span className="text-xs text-muted">{STAFF_ROLE_LABELS[r.role]}</span>
            </div>
          ),
        },
        { key: "open", header: "Open", align: "end", render: (r) => <span className="font-medium">{r.open}</span> },
        { key: "unseen", header: "Not seen", align: "end", render: (r) => (r.unseen > 0 ? <StatusPill tone="warning">{r.unseen}</StatusPill> : <span className="text-faint">0</span>) },
        { key: "progress", header: "In progress", align: "end", render: (r) => r.inProgress },
        { key: "hold", header: "On hold", align: "end", render: (r) => r.onHold },
        { key: "review", header: "Waiting review", align: "end", render: (r) => (r.inReview > 0 ? <StatusPill tone="info">{r.inReview}</StatusPill> : <span className="text-faint">0</span>) },
        { key: "overdue", header: "Overdue", align: "end", render: (r) => (r.overdue > 0 ? <StatusPill tone="danger">{r.overdue}</StatusPill> : <span className="text-faint">0</span>) },
        { key: "done", header: "Done", align: "end", render: (r) => r.done },
        {
          key: "ontime",
          header: "On time",
          align: "end",
          render: (r) => (r.done ? `${Math.round((r.doneOnTime / r.done) * 100)}%` : <span className="text-faint">—</span>),
        },
        { key: "days", header: "Avg working days", align: "end", render: (r) => r.avgWorkingDays ?? <span className="text-faint">—</span> },
        { key: "hours", header: "Hours logged", align: "end", render: (r) => r.loggedHours },
      ]}
    />
  );
};
