import { AlertTriangle, Boxes, Wallet } from "lucide-react";
import { listStock } from "services";
import { StatStrip, StatTile } from "ui";
import { formatCompactMoney, formatMoney, sumBy } from "utils";

export const StockStats = async () => {
  const rows = await listStock();
  const value = sumBy(rows, (r) => r.value);
  const below = rows.filter((r) => r.belowReorder).length;
  return (
    <StatStrip columns="sm:grid-cols-3">
      <StatTile
        tone="primary" href="/warehouse/stock"
        label="Items"
        value={rows.length}
        hint={`${rows.filter((r) => r.kind === "fixed_asset").length} fixed assets issued as custody`}
        icon={<Boxes size={18} />}
      />
      <StatTile tone="success" href="/warehouse/stock" label="Stock value" value={formatCompactMoney(value)} hint={`${formatMoney(value)} at average cost`} icon={<Wallet size={18} />} />
      <StatTile
        tone="warning" href="/warehouse/stock?filter=below"
        label="Below reorder level"
        value={below}
        hint={below > 0 ? "Raise a purchase request for these items" : "Every item is above its reorder level"}
        icon={<AlertTriangle size={18} />}
      />
    </StatStrip>
  );
};
