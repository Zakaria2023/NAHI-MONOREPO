import Link from "next/link";
import { PurchaseRequestDetail } from "services";
import { Card, StatusPill } from "ui";
import { formatDate, formatMoney } from "utils";
import { BUDGET_CATEGORY_LABELS } from "@/db/label";
import { FactList } from "@/components/shared/fact-list";

type RequestFactsProps = {
  detail: PurchaseRequestDetail;
};

export const RequestFacts = ({ detail }: RequestFactsProps) => {
  const { pr, project, estimate, budgetRemaining } = detail;
  // Before the manager approves, the estimate is not yet reserved, so it is compared with what is left.
  const beforeReservation = pr.status === "pending_manager";
  return (
    <Card>
      <div className="flex flex-col gap-4">
        <FactList
          columns={4}
          facts={[
            {
              label: "Project",
              value: (
                <Link href={`/projects/${project.uuid}`} className="hover:text-primary">
                  <span dir="ltr">{project.code}</span> · {project.name}
                </Link>
              ),
            },
            { label: "Department", value: pr.department },
            { label: "Budget category", value: BUDGET_CATEGORY_LABELS[pr.budgetCategory] },
            { label: "Requested by", value: `${pr.requestedBy} · ${formatDate(pr.createdAt)}` },
            { label: "Estimate", value: formatMoney(estimate) },
            {
              label: beforeReservation ? "Budget remaining (category)" : "Budget remaining after reservation",
              value: (
                <div className="flex flex-wrap items-center gap-2">
                  <span>{formatMoney(budgetRemaining)}</span>
                  {beforeReservation && (
                    <StatusPill tone={estimate <= budgetRemaining ? "success" : "danger"}>
                      {estimate <= budgetRemaining ? "Within budget" : "Exceeds budget"}
                    </StatusPill>
                  )}
                </div>
              ),
            },
            {
              label: "Procurement finding",
              value:
                pr.stockAvailable === undefined ? (
                  <span className="text-muted">Not reviewed yet</span>
                ) : pr.stockAvailable ? (
                  "Available in stock"
                ) : (
                  "To be purchased"
                ),
            },
            { label: "Lines", value: `${pr.lines.length} item(s)` },
          ]}
        />
        {pr.note && <p className="border-t border-hairline-soft pt-3 text-sm text-secondary">{pr.note}</p>}
      </div>
    </Card>
  );
};
