import { ArrowRight } from "lucide-react";
import { BudgetRevision } from "services";
import { EmptyState } from "ui";
import { formatDateTime, formatMoney } from "utils";
import { BUDGET_CATEGORY_LABELS } from "@/db/label";

type BudgetRevisionsProps = {
  revisions: BudgetRevision[];
};

/** Every change to an approved budget, who made it and why (finance §4 controls). */
export const BudgetRevisions = ({ revisions }: BudgetRevisionsProps) =>
  revisions.length === 0 ? (
    <EmptyState title="No revision">Changes made after approval are logged here with their reason.</EmptyState>
  ) : (
    <ol className="flex flex-col divide-y divide-hairline-soft">
      {[...revisions].reverse().map((revision) => (
        <li key={revision.at} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-ink">{revision.reason}</span>
            <span className="text-xs text-muted">
              {revision.by} · {formatDateTime(revision.at)}
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {revision.changes.map((change) => (
              <li key={change.category} className="flex flex-wrap items-center gap-1.5 text-xs text-secondary">
                <span className="text-ink">{BUDGET_CATEGORY_LABELS[change.category]}</span>
                <span className="tabular-nums">{formatMoney(change.from)}</span>
                <ArrowRight size={12} className="text-faint rtl:-scale-x-100" />
                <span className={`tabular-nums ${change.to > change.from ? "text-warning" : "text-success"}`}>{formatMoney(change.to)}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
