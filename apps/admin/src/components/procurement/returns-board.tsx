import { FileMinus, PackageX, RefreshCw } from "lucide-react";
import { listSupplierReturns } from "services";
import { StatStrip, StatTile } from "ui";
import { formatMoney, round2, sumBy } from "utils";
import { getCurrentStaff } from "@/lib/server/auth";
import { ReturnsTable } from "./returns-table";

export const ReturnsBoard = async () => {
  const [returns, actor] = await Promise.all([listSupplierReturns(), getCurrentStaff()]);
  const awaiting = returns.filter((r) => r.status === "awaiting_replacement");
  const openNotes = round2(sumBy(returns, (r) => r.openBalance));
  return (
    <>
      <StatStrip columns="sm:grid-cols-3">
        <StatTile tone="danger" label="Returns" value={returns.length} hint={formatMoney(round2(sumBy(returns, (r) => r.total)))} icon={<PackageX size={18} />} />
        <StatTile tone="warning" label="Awaiting replacement" value={awaiting.length} hint="Goods the supplier still owes" icon={<RefreshCw size={18} />} />
        <StatTile tone="teal" label="Open debit notes" value={formatMoney(openNotes)} hint="Deducted from the supplier's next invoice" icon={<FileMinus size={18} />} />
      </StatStrip>
      <ReturnsTable returns={returns} canReceive={actor.role === "warehouse_keeper" || actor.role === "system_admin"} />
    </>
  );
};
