import { SupplierRow } from "services";
import { Table } from "ui";

type SuppliersTableProps = {
  suppliers: SupplierRow[];
};

export const SuppliersTable = ({ suppliers }: SuppliersTableProps) => (
  <Table
    data={suppliers}
    rowKey={(s) => s.uuid}
    emptyMessage="No supplier registered yet. Register one with the form — quotations can only be recorded from registered suppliers."
    columns={[
      {
        key: "name",
        header: "Supplier",
        render: (s) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{s.name}</span>
            <span className="line-clamp-1 text-xs text-muted">{s.address}</span>
          </div>
        ),
      },
      { key: "vat", header: "VAT number", render: (s) => <span dir="ltr">{s.vatNumber}</span> },
      { key: "cr", header: "CR", render: (s) => <span dir="ltr">{s.crNumber}</span> },
      {
        key: "contact",
        header: "Contact",
        render: (s) => (
          <div className="flex flex-col gap-0.5">
            <span dir="ltr" className="w-fit">
              {s.email}
            </span>
            <span dir="ltr" className="w-fit text-xs text-muted">
              {s.phone}
            </span>
          </div>
        ),
      },
      { key: "pos", header: "POs", align: "end", render: (s) => s.poCount },
      {
        key: "rating",
        header: "Rating",
        align: "end",
        render: (s) =>
          s.rating === null ? (
            <span className="text-xs text-muted">Not evaluated</span>
          ) : (
            <span className="whitespace-nowrap">
              {s.rating.toFixed(1)} / 5 <span className="text-muted">({s.evaluations})</span>
            </span>
          ),
      },
    ]}
  />
);
