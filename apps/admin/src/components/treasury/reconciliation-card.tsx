import { CircleCheck } from "lucide-react";
import { BankAccountDetail } from "services";
import { Card } from "ui";
import { formatDate, formatMoney, formatPeriod } from "utils";
import { FigureRow } from "@/components/finance/figure-row";
import { FormAction } from "@/lib/action-result";
import { ReconciliationForm } from "./reconciliation-form";

type ReconciliationCardProps = {
  detail: BankAccountDetail;
  action: FormAction;
};

/** The month's statement against the book: the uncleared cheques explain the difference, and the rest must be zero. */
export const ReconciliationCard = ({ detail, action }: ReconciliationCardProps) => {
  const { gap, reconciliation } = detail;
  return (
    <Card title="Bank reconciliation" description={`${formatPeriod(detail.period)} — the closing checklist needs every account reconciled`}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col">
          <FigureRow label="Book balance at month end" amount={gap.bookBalance} />
          <FigureRow label="Cheques written, not yet cleared" amount={gap.outstandingIssued} />
          <FigureRow label="Cheques received, not yet credited" amount={gap.uncreditedReceived} sign="−" />
          <FigureRow label="The statement should show" amount={gap.expectedStatement} sign="=" emphasis />
        </div>
        {reconciliation ? (
          <p className="flex items-start gap-2 text-sm text-secondary">
            <CircleCheck size={16} className="mt-0.5 shrink-0 text-success" />
            <span>
              Reconciled by {reconciliation.by} on {formatDate(reconciliation.at)} — statement {formatMoney(reconciliation.statementBalance)}.
            </span>
          </p>
        ) : (
          <ReconciliationForm key={detail.period} action={action} period={detail.period} />
        )}
      </div>
    </Card>
  );
};
