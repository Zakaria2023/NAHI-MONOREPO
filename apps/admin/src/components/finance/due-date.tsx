import { StatusPill } from "ui";
import { daysUntil, formatDate } from "utils";

type DueDateProps = {
  dueAt: string;
  overdue: boolean;
};

/** A due date, with the red pill once it has passed unpaid. */
export const DueDate = ({ dueAt, overdue }: DueDateProps) => (
  <div className="flex flex-col items-start gap-1">
    <span className="whitespace-nowrap">{formatDate(dueAt)}</span>
    {overdue && <StatusPill tone="danger">Overdue · {-daysUntil(dueAt)} days</StatusPill>}
  </div>
);
