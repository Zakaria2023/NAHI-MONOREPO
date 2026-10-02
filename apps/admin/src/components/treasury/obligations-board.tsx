import { AlarmClock, CircleCheck, Receipt } from "lucide-react";
import { listObligations } from "services";
import { Card, StatStrip, StatTile } from "ui";
import { formatDate, formatMoney } from "utils";
import { OBLIGATION_KIND_LABELS } from "@/db/label";
import { CsvButton } from "@/components/shared/csv-button";
import { ObligationsTable } from "./obligations-table";

export const ObligationsBoard = async () => {
  const rows = await listObligations();
  const open = rows.filter((r) => r.status !== "filed");
  const next = open[0];
  return (
    <>
      <StatStrip columns="sm:grid-cols-3">
        <StatTile
          tone={next && next.daysLeft <= 7 ? "danger" : "primary"}
          label="Next due"
          value={next ? OBLIGATION_KIND_LABELS[next.kind] : "Nothing open"}
          hint={next ? `${next.period} — ${formatDate(next.dueAt)} (${next.daysLeft} day(s))` : "Every recent month is filed"}
          icon={<AlarmClock size={18} />}
        />
        <StatTile tone="warning" label="Overdue" value={rows.filter((r) => r.status === "overdue").length} hint="Past the due date, not filed" icon={<Receipt size={18} />} />
        <StatTile tone="success" label="Filed" value={rows.filter((r) => r.status === "filed").length} hint="Of the last six months" icon={<CircleCheck size={18} />} />
      </StatStrip>
      <Card
        title="Obligations"
        description={`VAT by the last day of the next month; GOSI by the 15th — open total ${formatMoney(open.reduce((sum, r) => sum + Math.max(0, r.amount), 0))}`}
        action={
          <CsvButton
            filename="tax-obligations"
            rows={[
              ["Obligation", "Month", "Due", "Amount", "Status", "Reference"],
              ...rows.map((r) => [OBLIGATION_KIND_LABELS[r.kind], r.period, r.dueAt.slice(0, 10), r.amount, r.status, r.filing?.reference ?? ""]),
            ]}
          />
        }
      >
        <ObligationsTable rows={rows} />
      </Card>
    </>
  );
};
