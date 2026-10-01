import { PurchaseOrder } from "services";
import { Card } from "ui";
import { formatDateTime } from "utils";

type AmendmentsCardProps = {
  amendments: PurchaseOrder["amendments"];
};

/** The PO's change log — cancellations and advances, with who and when. */
export const AmendmentsCard = ({ amendments }: AmendmentsCardProps) => (
  <Card title="Amendments" description="Changes made to the PO after it was raised">
    {amendments.length === 0 ? (
      <p className="text-sm text-muted">No change since the PO was raised.</p>
    ) : (
      <ul className="flex flex-col divide-y divide-hairline-soft">
        {amendments.map((a) => (
          <li key={`${a.at}-${a.note}`} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
            <span className="text-sm text-ink">{a.note}</span>
            <span className="text-xs text-muted">
              {a.by} · {formatDateTime(a.at)}
            </span>
          </li>
        ))}
      </ul>
    )}
  </Card>
);
