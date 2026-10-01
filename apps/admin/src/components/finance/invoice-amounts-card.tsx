import { SupplierInvoiceRow } from "services";
import { Card } from "ui";
import { FigureRow } from "./figure-row";

type InvoiceAmountsCardProps = {
  invoice: SupplierInvoiceRow;
};

export const InvoiceAmountsCard = ({ invoice }: InvoiceAmountsCardProps) => (
  <Card title="Amounts" description="The PO's advance is recovered automatically when the invoice is registered.">
    <div className="flex flex-col">
      <FigureRow label="Net" amount={invoice.subtotal} />
      <FigureRow label="VAT 15 %" amount={invoice.vat} />
      <FigureRow label="Total" amount={invoice.total} emphasis />
      <FigureRow label="Advance recovered" amount={invoice.advanceDeducted} sign="−" />
      <FigureRow label="Net payable" amount={invoice.netPayable} sign="=" emphasis />
      <FigureRow label="Paid" amount={invoice.paid} sign="−" />
      <FigureRow
        label="Outstanding"
        amount={invoice.outstanding}
        sign="="
        emphasis
        tone={invoice.outstanding <= 0 ? "success" : invoice.overdue ? "danger" : undefined}
      />
    </div>
  </Card>
);
