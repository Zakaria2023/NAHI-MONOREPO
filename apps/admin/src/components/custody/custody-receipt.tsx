import { CashCustodyDetail } from "services";
import { formatDate, formatDateTime, formatMoney } from "utils";
import { BUDGET_CATEGORY_LABELS } from "@/db/label";

type CustodyReceiptProps = {
  detail: CashCustodyDetail;
};

/** The custody receipt form as the employee signs it: serial, who, where, which work order, and each line. */
export const CustodyReceipt = ({ detail: { custody, project } }: CustodyReceiptProps) => {
  const fields = [
    { label: "Employee", value: custody.employeeName },
    { label: "City", value: custody.city },
    { label: "Date", value: formatDate(custody.createdAt) },
    { label: "Work order no.", value: <span dir="ltr">{custody.workOrderNo}</span> },
    { label: "Project", value: <span dir="ltr">{project.code}</span>, hint: project.name },
    { label: "Budget category", value: BUDGET_CATEGORY_LABELS[custody.budgetCategory] },
  ];
  return (
    <section className="rounded-card border border-hairline bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline px-6 py-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs tracking-wide text-muted uppercase">Cash custody receipt</span>
          <h2 className="text-xl text-ink">Custody receipt form</h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-muted">Serial no.</span>
          <span className="rounded-control border border-hairline px-3 py-1 text-base text-ink" dir="ltr">
            {custody.number}
          </span>
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-hairline-soft px-6 py-5 md:grid-cols-3">
        {fields.map((f) => (
          <div key={f.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted">{f.label}</dt>
            <dd className="text-sm text-ink">{f.value}</dd>
            {f.hint && <dd className="text-xs text-muted">{f.hint}</dd>}
          </div>
        ))}
      </dl>
      <div className="px-6 py-4">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs text-muted">
              <th className="w-12 py-2 text-start font-normal">#</th>
              <th className="py-2 text-start font-normal">Description</th>
              <th className="py-2 text-end font-normal">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {custody.lines.map((line, index) => (
              <tr key={`${line.description}-${index}`}>
                <td className="py-2 text-muted">{index + 1}</td>
                <td className="py-2 text-ink">{line.description}</td>
                <td className="py-2 text-end text-ink">{formatMoney(line.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-hairline">
              <td />
              <td className="py-3 text-end text-muted">Total</td>
              <td className="py-3 text-end text-base font-medium text-ink">{formatMoney(custody.amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <footer className="grid grid-cols-1 gap-6 border-t border-hairline-soft px-6 py-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted">Received by the employee</span>
          <span className="min-h-7 border-b border-dashed border-hairline pb-2 text-sm text-ink">{custody.receiptSignedAt ? custody.employeeName : ""}</span>
          <span className="text-xs text-muted">{custody.receiptSignedAt ? `Signed ${formatDateTime(custody.receiptSignedAt)}` : "Signed on disbursement"}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted">Disbursed</span>
          <span className="min-h-7 border-b border-dashed border-hairline pb-2 text-sm text-ink">{custody.disbursedAt ? formatMoney(custody.amount) : ""}</span>
          <span className="text-xs text-muted">{custody.disbursedAt ? formatDateTime(custody.disbursedAt) : "Once all six approvals are in"}</span>
        </div>
      </footer>
    </section>
  );
};
