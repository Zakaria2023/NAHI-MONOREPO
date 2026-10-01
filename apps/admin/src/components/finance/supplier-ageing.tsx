import Link from "next/link";
import { supplierAgeing } from "services";
import { AgeingTable } from "./ageing-table";

export const SupplierAgeing = async () => {
  const rows = await supplierAgeing();
  return (
    <AgeingTable
      header="Supplier"
      emptyMessage="No supplier balance is open."
      rows={rows.map((row) => ({
        key: row.supplierUuid,
        label: (
          <Link href={`/finance/payables/statement/${row.supplierUuid}`} className="font-medium after:absolute after:inset-0 hover:text-primary">
            {row.supplierName}
          </Link>
        ),
        buckets: row,
      }))}
    />
  );
};
