import { SupplierInvoiceRow } from "services";
import { Card } from "ui";
import { FigureRow } from "./figure-row";

type InvoiceAmountsCardProps = {
  invoice: SupplierInvoiceRow;
};

export const InvoiceAmountsCard = ({ invoice }: InvoiceAmountsCardProps) => (
  <Card title="Amounts" description="The PO's advance, a late-delivery penalty and open debit notes come off automatically when the invoice is registered.">
    <div className="flex flex-col">
      <FigureRow label="Net" amount={invoice.subtotal} />
      <FigureRow label="VAT 15 %" amount={invoice.vat} />
      <FigureRow label="Total" amount={invoice.total} emphasis />
      <FigureRow label="Advance recovered" amount={invoice.advanceDeducted} sign="−" />
      {(invoice.latePenalty ?? 0) > 0 && <FigureRow label="Late-delivery penalty" amount={invoice.latePenalty ?? 0} sign="−" />}
      {(invoice.debitNotesDeducted ?? 0) > 0 && <FigureRow label="Debit notes set off" amount={invoice.debitNotesDeducted ?? 0} sign="−" />}
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
