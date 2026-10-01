import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { listSubcontractors, listSubcontracts } from "services";
import { Card, EmptyState } from "ui";
import { formatMoney, sumBy } from "utils";

export const SubcontractorsList = async () => {
  const [subcontractors, subcontracts] = await Promise.all([listSubcontractors(), listSubcontracts()]);
  return (
    <Card title="Subcontractors" description="Open one for its statement: extracts, retention held, materials deducted and payments.">
      {subcontractors.length === 0 ? (
        <EmptyState title="No subcontractor yet" />
      ) : (
        <ul className="flex flex-col divide-y divide-hairline-soft">
          {subcontractors.map((s) => {
            const own = subcontracts.filter((c) => c.subcontractorUuid === s.uuid);
            return (
              <li key={s.uuid} className="relative flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-0.5">
                  <Link href={`/finance/subcontracts/statement/${s.uuid}`} className="text-sm font-medium text-ink after:absolute after:inset-0 hover:text-primary">
                    {s.name}
                  </Link>
                  <span className="text-xs text-muted">
                    {own.length} subcontract(s) · {formatMoney(sumBy(own, (c) => c.value))}
                  </span>
                </div>
                <ChevronRight size={16} className="text-faint rtl:-scale-x-100" />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};
