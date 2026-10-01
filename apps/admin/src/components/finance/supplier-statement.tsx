import { notFound } from "next/navigation";
import { listSuppliers, supplierStatement } from "services";
import { Card, StatStrip, StatTile, Table } from "ui";
import { formatDate, formatMoney, round2, sumBy } from "utils";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";

type SupplierStatementProps = {
  supplierUuid: string;
};

/** Finance §1 step 9: the statement the supplier's own is reconciled against. */
export const SupplierStatement = async ({ supplierUuid }: SupplierStatementProps) => {
  const [suppliers, rows] = await Promise.all([listSuppliers(), supplierStatement(supplierUuid)]);
  const supplier = suppliers.find((s) => s.uuid === supplierUuid);
  if (!supplier) {
    notFound();
  }
  const credits = round2(sumBy(rows, (r) => r.credit));
  const debits = round2(sumBy(rows, (r) => r.debit));
  const balance = rows.at(-1)?.balance ?? 0;
  return (
    <>
      <PageHeader
        title={`${supplier.name} — statement`}
        description="Invoices credited, advances recovered and payments debited, with the running balance owed to the supplier."
        back={{ href: "/finance/payables", label: "Supplier invoices" }}
      />
      <Card>
        <FactList
          columns={4}
          facts={[
            { label: "VAT number", value: <span dir="ltr">{supplier.vatNumber}</span> },
            { label: "CR number", value: <span dir="ltr">{supplier.crNumber}</span> },
            { label: "E-mail", value: <span dir="ltr">{supplier.email}</span> },
            { label: "Phone", value: <span dir="ltr">{supplier.phone}</span> },
          ]}
        />
      </Card>
      <StatStrip columns="sm:grid-cols-3">
        <StatTile label="Invoiced" value={formatMoney(credits)} hint="Credited, VAT included" />
        <StatTile label="Paid and recovered" value={formatMoney(debits)} hint="Payments plus advances recovered" />
        <StatTile label="Balance owed" value={formatMoney(balance)} hint={balance > 0 ? "Still payable to the supplier" : "Nothing owed"} />
      </StatStrip>
      <Table
        data={rows.map((r, index) => ({ ...r, key: String(index) }))}
        rowKey={(r) => r.key}
        emptyMessage="No invoice registered for this supplier yet."
        columns={[
          { key: "at", header: "Date", render: (r) => <span className="whitespace-nowrap">{formatDate(r.at)}</span> },
          { key: "reference", header: "Reference", render: (r) => <span dir="ltr">{r.reference}</span> },
          { key: "description", header: "Description", wrap: true, render: (r) => r.description },
          { key: "debit", header: "Debit", align: "end", render: (r) => (r.debit > 0 ? formatMoney(r.debit) : <span className="text-muted">—</span>) },
          { key: "credit", header: "Credit", align: "end", render: (r) => (r.credit > 0 ? formatMoney(r.credit) : <span className="text-muted">—</span>) },
          { key: "balance", header: "Balance", align: "end", render: (r) => <span className="font-medium">{formatMoney(r.balance)}</span> },
        ]}
      />
    </>
  );
};
