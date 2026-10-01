import Link from "next/link";
import { listPurchaseRequests } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { PurchaseRequestStatus } from "@/db/enum";
import { BUDGET_CATEGORY_LABELS, PURCHASE_REQUEST_STATUS_LABELS, STAFF_ROLE_LABELS } from "@/db/label";
import { PR_TONES } from "@/lib/status-tones";

type PurchaseRequestsTableProps = {
  group?: string;
  search?: string;
};

/** The filter tabs: procurement review sits with the RFQs — both are on procurement's desk. */
const GROUPS: Record<string, PurchaseRequestStatus[]> = {
  waiting: ["pending_manager", "stock_approval", "quote_approval"],
  rfq: ["in_review", "rfq"],
  ordered: ["ordered"],
  closed: ["fulfilled_from_stock", "rejected"],
};

export const PurchaseRequestsTable = async ({ group, search }: PurchaseRequestsTableProps) => {
  const statuses = group ? GROUPS[group] : undefined;
  const term = search?.trim().toLowerCase();
  const requests = (await listPurchaseRequests()).filter(
    (pr) =>
      (!statuses || statuses.includes(pr.status)) &&
      (!term || [pr.number, pr.projectCode, pr.department, pr.requestedBy].some((v) => v.toLowerCase().includes(term))),
  );
  return (
    <Table
      data={requests}
      rowKey={(pr) => pr.uuid}
      emptyMessage="No purchase request here. Raise one with “New purchase request” when an item reaches its reorder level."
      columns={[
        {
          key: "number",
          header: "Request",
          render: (pr) => (
            <div className="flex flex-col gap-0.5">
              <Link
                href={`/procurement/requests/${pr.uuid}`}
                dir="ltr"
                className="w-fit font-medium text-ink after:absolute after:inset-0 hover:text-primary"
              >
                {pr.number}
              </Link>
              <span className="text-xs text-muted">{pr.requestedBy}</span>
            </div>
          ),
        },
        { key: "project", header: "Project", render: (pr) => <span dir="ltr">{pr.projectCode}</span> },
        {
          key: "department",
          header: "Department",
          render: (pr) => (
            <div className="flex flex-col gap-0.5">
              <span>{pr.department}</span>
              <span className="text-xs text-muted">{BUDGET_CATEGORY_LABELS[pr.budgetCategory]}</span>
            </div>
          ),
        },
        { key: "items", header: "Items", align: "end", render: (pr) => pr.itemCount },
        { key: "estimate", header: "Estimate", align: "end", render: (pr) => <span className="whitespace-nowrap">{formatMoney(pr.estimate)}</span> },
        {
          key: "status",
          header: "Status",
          render: (pr) => <StatusPill tone={PR_TONES[pr.status]}>{PURCHASE_REQUEST_STATUS_LABELS[pr.status]}</StatusPill>,
        },
        {
          key: "awaiting",
          header: "Awaiting",
          render: (pr) =>
            pr.awaiting ? <span className="text-secondary">{STAFF_ROLE_LABELS[pr.awaiting]}</span> : <span className="text-muted">—</span>,
        },
        { key: "date", header: "Raised", render: (pr) => <span className="whitespace-nowrap text-muted">{formatDate(pr.createdAt)}</span> },
      ]}
    />
  );
};
