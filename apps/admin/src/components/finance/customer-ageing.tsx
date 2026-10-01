import { customerAgeing } from "services";
import { OperatorPill } from "@/components/shared/operator-pill";
import { AgeingTable } from "./ageing-table";

export const CustomerAgeing = async () => {
  const rows = await customerAgeing();
  return (
    <AgeingTable
      header="Customer"
      emptyMessage="Every customer invoice is collected."
      rows={rows.map((row) => ({ key: row.operator, label: <OperatorPill operator={row.operator} />, buckets: row }))}
    />
  );
};
