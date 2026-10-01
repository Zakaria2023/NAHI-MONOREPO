import { vatSummary } from "services";
import { StatStrip, StatTile, StatusPill, Table } from "ui";
import { formatMoney, round2, sumBy } from "utils";

/** Output VAT from customer invoices, input VAT from supplier invoices, by month. */
export const VatSummary = async () => {
  const periods = await vatSummary();
  const output = round2(sumBy(periods, (p) => p.output));
  const input = round2(sumBy(periods, (p) => p.input));
  const net = round2(output - input);
  return (
    <>
      <StatStrip columns="sm:grid-cols-3">
        <StatTile label="Output VAT" value={formatMoney(output)} hint="Charged on customer invoices, all periods" />
        <StatTile label="Input VAT" value={formatMoney(input)} hint="Paid on supplier invoices, all periods" />
        <StatTile label={net >= 0 ? "Net payable" : "Net refundable"} value={formatMoney(Math.abs(net))} hint="Output less input" />
      </StatStrip>
      <Table
        data={periods}
        rowKey={(p) => p.period}
        emptyMessage="No invoice carries VAT yet."
        columns={[
          { key: "period", header: "Month", render: (p) => <span dir="ltr" className="font-medium">{p.period}</span> },
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
    </>
  );
};
