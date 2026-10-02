import { vatQuarters, vatSummary } from "services";
import { Card, StatStrip, StatTile, StatusPill, Table } from "ui";
import { formatMoney, formatPeriod, round2, sumBy } from "utils";
import { CsvButton } from "@/components/shared/csv-button";
import { PrintButton } from "@/components/shared/print-button";

type VatSummaryProps = {
  quarterly: boolean;
};

/** Output VAT from customer invoices, input VAT from supplier invoices and expenses — by month or by quarter. */
export const VatSummary = async ({ quarterly }: VatSummaryProps) => {
  const months = await vatSummary();
  const rows = quarterly
    ? (await vatQuarters()).map((q) => ({ ...q, label: `${q.quarter} (${q.months.map(formatPeriod).join(", ")})` }))
    : months.map((m) => ({ ...m, label: formatPeriod(m.period) }));
  const output = round2(sumBy(months, (p) => p.output));
  const input = round2(sumBy(months, (p) => p.input));
  const net = round2(output - input);
  return (
    <>
      <StatStrip columns="sm:grid-cols-3">
        <StatTile label="Output VAT" value={formatMoney(output)} hint="Charged on customer invoices, all periods" />
        <StatTile label="Input VAT" value={formatMoney(input)} hint="Paid on supplier invoices and expenses" />
        <StatTile label={net >= 0 ? "Net payable" : "Net refundable"} value={formatMoney(Math.abs(net))} hint="Output less input" />
      </StatStrip>
      <Card
        title={quarterly ? "Quarterly VAT return" : "Monthly VAT"}
        description="Matches the books: every figure comes from a registered invoice or expense"
        action={
          <div className="flex flex-wrap gap-2">
            <CsvButton
              filename={quarterly ? "vat-quarterly" : "vat-monthly"}
              rows={[["Period", "Output VAT", "Input VAT", "Net"], ...rows.map((r) => [r.period, r.output, r.input, r.net])]}
            />
            <PrintButton />
          </div>
        }
      >
        <Table
          data={rows}
          rowKey={(p) => p.period}
          emptyMessage="No invoice carries VAT yet."
          columns={[
            { key: "period", header: quarterly ? "Quarter" : "Month", render: (p) => <span className="font-medium">{p.label}</span> },
            { key: "output", header: "Output VAT", align: "end", render: (p) => formatMoney(p.output) },
            { key: "input", header: "Input VAT", align: "end", render: (p) => formatMoney(p.input) },
            {
              key: "net",
              header: "Net",
              align: "end",
              render: (p) => <span className={`font-medium ${p.net < 0 ? "text-success" : ""}`}>{formatMoney(Math.abs(p.net))}</span>,
            },
            {
              key: "position",
              header: "Position",
              render: (p) =>
                p.net > 0 ? <StatusPill tone="warning">Payable</StatusPill> : p.net < 0 ? <StatusPill tone="success">Refundable</StatusPill> : <StatusPill>Nil</StatusPill>,
            },
          ]}
        />
      </Card>
    </>
  );
};
