import Link from "next/link";
import { getSupplierContract } from "services";
import { Card, StatStrip, StatTile, StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/db/label";
import { PageHeader } from "@/components/shared/page-header";
import { PO_TONES } from "@/lib/status-tones";

type ContractViewProps = {
  uuid: string;
};

export const ContractView = async ({ uuid }: ContractViewProps) => {
  const { contract, supplier, lines, callOffs } = await getSupplierContract(uuid);
  return (
    <>
      <PageHeader
        title={`${contract.number} — ${contract.title}`}
        description={`${supplier.name} · in force ${formatDate(contract.startsAt)} – ${formatDate(contract.endsAt)}`}
        back={{ href: "/procurement/contracts", label: "Annual contracts" }}
        meta={<StatusPill tone={contract.active ? "success" : "neutral"}>{contract.active ? "In force" : "Not in force"}</StatusPill>}
      />
      <StatStrip columns="sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Call-off POs" value={contract.callOffCount} hint="Raised under this contract" />
        <StatTile label="Ordered so far" value={formatMoney(contract.orderedValue)} hint="Excl. VAT; cancelled POs left out" />
        <StatTile label="Delivery · payment" value={`${contract.deliveryDays} d · ${contract.paymentTermsDays} d`} hint="Every call-off inherits these" />
        <StatTile
          label="Late penalty"
          value={`${contract.latePenaltyPctPerDay} %`}
          hint={`A day late, capped at ${contract.latePenaltyCapPct} % of the invoice`}
        />
      </StatStrip>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Agreed prices" description="Excluding VAT">
          <Table
            data={lines}
            rowKey={(l) => l.itemUuid}
            columns={[
              { key: "code", header: "Code", render: (l) => <span dir="ltr">{l.item.code}</span> },
              { key: "name", header: "Item", render: (l) => l.item.name },
              { key: "unit", header: "Unit", render: (l) => l.item.unit },
              { key: "price", header: "Unit price", align: "end", render: (l) => formatMoney(l.unitPrice) },
            ]}
          />
        </Card>
        <Card title="Call-off POs" description="Ordered at the contract's prices, without an RFQ">
          <Table
            data={callOffs}
            rowKey={(p) => p.uuid}
            emptyMessage="Nothing ordered under this contract yet."
            columns={[
              {
                key: "number",
                header: "PO",
                render: (p) => (
                  <Link href={`/procurement/orders/${p.uuid}`} dir="ltr" className="font-medium text-ink after:absolute after:inset-0">
                    {p.number}
                  </Link>
                ),
              },
              { key: "date", header: "Raised", render: (p) => formatDate(p.createdAt) },
              {
                key: "status",
                header: "Status",
                render: (p) => <StatusPill tone={PO_TONES[p.status]}>{PURCHASE_ORDER_STATUS_LABELS[p.status]}</StatusPill>,
              },
              { key: "total", header: "Total", align: "end", render: (p) => formatMoney(p.total) },
            ]}
          />
        </Card>
      </div>
    </>
  );
};
