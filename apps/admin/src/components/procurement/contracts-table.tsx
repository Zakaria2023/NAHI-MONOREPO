import Link from "next/link";
import { SupplierContractRow } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";

type ContractsTableProps = {
  contracts: SupplierContractRow[];
};

export const ContractsTable = ({ contracts }: ContractsTableProps) => (
  <Table
    data={contracts}
    rowKey={(c) => c.uuid}
    emptyMessage="No annual contracts yet."
    columns={[
      {
        key: "number",
        header: "Contract",
        render: (c) => (
          <div className="flex flex-col gap-0.5">
            <Link href={`/procurement/contracts/${c.uuid}`} dir="ltr" className="font-medium text-ink after:absolute after:inset-0">
              {c.number}
            </Link>
            <span className="text-xs text-muted">{c.title}</span>
          </div>
        ),
      },
      { key: "supplier", header: "Supplier", render: (c) => c.supplierName },
      { key: "from", header: "From", render: (c) => formatDate(c.startsAt) },
      { key: "until", header: "Until", render: (c) => formatDate(c.endsAt) },
      { key: "items", header: "Items", align: "end", render: (c) => c.lines.length },
      { key: "terms", header: "Delivery · payment", render: (c) => `${c.deliveryDays} d · ${c.paymentTermsDays} d` },
      { key: "penalty", header: "Late penalty", render: (c) => `${c.latePenaltyPctPerDay} % a day, cap ${c.latePenaltyCapPct} %` },
      { key: "calloffs", header: "Call-off POs", align: "end", render: (c) => c.callOffCount },
      { key: "ordered", header: "Ordered", align: "end", render: (c) => formatMoney(c.orderedValue) },
      {
        key: "status",
        header: "Status",
        render: (c) => <StatusPill tone={c.active ? "success" : "neutral"}>{c.active ? "In force" : "Not in force"}</StatusPill>,
      },
    ]}
  />
);
