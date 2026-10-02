import Link from "next/link";
import { getSupplierInvoice, listBankAccounts } from "services";
import { Card, StatusPill } from "ui";
import { formatDate, formatDateTime } from "utils";
import { SUPPLIER_INVOICE_STATUS_LABELS } from "@/db/label";
import { approveSupplierInvoiceAction, recordSupplierPaymentAction } from "@/app/(dashboard)/finance/payables/[uuid]/actions";
import { ActionButton } from "@/components/shared/action-button";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentStaff } from "@/lib/server/auth";
import { SUPPLIER_INVOICE_TONES } from "@/lib/status-tones";
import { BlockedNote } from "./blocked-note";
import { DoneNote } from "./done-note";
import { DueDate } from "./due-date";
import { InvoiceAmountsCard } from "./invoice-amounts-card";
import { PaymentForm } from "./payment-form";
import { SupplierCard } from "./supplier-card";
import { SupplierPaymentsTable } from "./supplier-payments-table";
import { ThreeWayMatchCard } from "./three-way-match-card";

type SupplierInvoiceDetailProps = {
  uuid: string;
};

export const SupplierInvoiceDetail = async ({ uuid }: SupplierInvoiceDetailProps) => {
  const [{ invoice, supplier, po, receipts, match }, actor, accounts] = await Promise.all([
    getSupplierInvoice(uuid),
    getCurrentStaff(),
    listBankAccounts(),
  ]);
  const approveBlocker = actor.role === "finance_manager" ? null : "Only the Finance manager approves supplier invoices — switch user at the foot of the sidebar.";
  const paymentBlocker =
    invoice.status === "registered"
      ? "Payments are made against an approved invoice — approve it first."
      : invoice.status === "rejected"
        ? "The invoice was rejected."
        : null;
  return (
    <>
      <PageHeader
        title={invoice.number}
        description={`${supplier.name} invoice ${invoice.invoiceNumber}, against ${po.number}.`}
        back={{ href: "/finance/payables", label: "Supplier invoices" }}
        meta={
          <>
            <StatusPill tone={SUPPLIER_INVOICE_TONES[invoice.status]}>{SUPPLIER_INVOICE_STATUS_LABELS[invoice.status]}</StatusPill>
            {invoice.overdue && <StatusPill tone="danger">Overdue</StatusPill>}
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <FactList
              columns={4}
              facts={[
                { label: "Supplier invoice no.", value: <span dir="ltr">{invoice.invoiceNumber}</span> },
                { label: "Invoice date", value: formatDate(invoice.invoiceDate) },
                {
                  label: "Purchase order",
                  value: (
                    <Link href={`/procurement/orders/${po.uuid}`} dir="ltr" className="hover:text-primary">
                      {po.number}
                    </Link>
                  ),
                },
                { label: "Payment terms", value: `${po.paymentTermsDays} days` },
                { label: "Due", value: <DueDate dueAt={invoice.dueDate} overdue={invoice.overdue} /> },
                { label: "Registered by", value: invoice.registeredBy },
                { label: "Registered", value: formatDateTime(invoice.createdAt) },
                { label: "Approved by", value: invoice.approvedBy ?? "—" },
              ]}
            />
          </Card>
          <ThreeWayMatchCard po={po} receipts={receipts} invoiceNet={invoice.subtotal} match={match} />
          <Card title="Payments" description="Bank transfer or cheque against this invoice. Each payment e-mails a notice to the supplier.">
            <div className="flex flex-col gap-5">
              {invoice.status === "approved" && invoice.outstanding > 0 && (
                <PaymentForm
                  action={recordSupplierPaymentAction.bind(null, invoice.uuid)}
                  outstanding={invoice.outstanding}
                  accounts={accounts.map((a) => ({ value: a.uuid, label: `${a.code} — ${a.bank}` }))}
                />
              )}
              {paymentBlocker && <BlockedNote reason={paymentBlocker} />}
              {invoice.status === "paid" && <DoneNote label="Paid in full" at={invoice.payments.at(-1)?.at} />}
              <SupplierPaymentsTable payments={invoice.payments} />
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card title="Approval" description="The Finance manager approves; the invoice then joins the weekly due schedule.">
            {invoice.status === "registered" ? (
              <ActionButton action={approveSupplierInvoiceAction.bind(null, invoice.uuid)} label="Approve invoice" variant="success" blocker={approveBlocker} />
            ) : invoice.status === "rejected" ? (
              <BlockedNote reason="The invoice was rejected." />
            ) : (
              <DoneNote label="Approved" by={invoice.approvedBy} />
            )}
          </Card>
          <InvoiceAmountsCard invoice={invoice} />
          <SupplierCard supplier={supplier} />
        </div>
      </div>
    </>
  );
};
