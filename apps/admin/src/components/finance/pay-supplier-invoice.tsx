import { getSupplierInvoice, listBankAccounts } from "services";
import { Card } from "ui";
import { formatMoney } from "utils";
import { recordSupplierPaymentAction } from "@/app/(dashboard)/finance/payables/[uuid]/pay/actions";
import { PageHeader } from "@/components/shared/page-header";
import { BlockedNote } from "./blocked-note";
import { PaymentForm } from "./payment-form";

type PaySupplierInvoiceProps = {
  uuid: string;
};

/** Finance §1 steps 7–8: pay by transfer or cheque; the supplier is e-mailed a notice. */
export const PaySupplierInvoice = async ({ uuid }: PaySupplierInvoiceProps) => {
  const [{ invoice, supplier }, accounts] = await Promise.all([getSupplierInvoice(uuid), listBankAccounts()]);
  const payable = invoice.status === "approved" && invoice.outstanding > 0;
  return (
    <>
      <PageHeader
        title={`Pay ${invoice.invoiceNumber}`}
        description={`${supplier.name} — ${formatMoney(invoice.outstanding)} still to pay. A notice is e-mailed to the supplier with each payment.`}
        back={{ href: `/finance/payables/${invoice.uuid}`, label: invoice.number }}
      />
      {payable ? (
        <Card title="Payment" description="A cheque is booked now and shows in Cheques until it clears">
          <PaymentForm
            action={recordSupplierPaymentAction.bind(null, invoice.uuid)}
            outstanding={invoice.outstanding}
            accounts={accounts.map((a) => ({ value: a.uuid, label: `${a.code} — ${a.bank}` }))}
          />
        </Card>
      ) : (
        <BlockedNote reason={invoice.status === "paid" ? "The invoice is paid in full." : "Payments are made against an approved invoice."} />
      )}
    </>
  );
};
