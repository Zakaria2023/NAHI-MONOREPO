import { BadgeCheck, Bell, FolderKanban, Receipt, ShoppingCart, Wallet } from "lucide-react";
import { getDashboardSummary, listAlerts } from "services";
import { StatTile } from "ui";
import { formatCompactMoney, formatMoney } from "utils";
import { getCurrentStaff } from "@/lib/server/auth";

export const KpiRow = async () => {
  const actor = await getCurrentStaff();
  const [summary, alerts] = await Promise.all([getDashboardSummary(actor.role), listAlerts()]);
  const mobily = summary.projects.find((p) => p.operator === "mobily");
  const stc = summary.projects.find((p) => p.operator === "stc");
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatTile label="Active projects" value={(mobily?.active ?? 0) + (stc?.active ?? 0)} hint={`Mobily ${mobily?.active ?? 0} · STC ${stc?.active ?? 0}`} icon={<FolderKanban size={18} />} />
      <StatTile label="Waiting for you" value={summary.pendingTotal} hint="Approvals and tasks for your role" icon={<BadgeCheck size={18} />} />
      <StatTile label="Urgent alerts" value={alerts.filter((a) => a.severity === "danger").length} hint={`${alerts.length} alerts in total`} icon={<Bell size={18} />} />
      <StatTile label="Open POs" value={summary.openPurchaseOrders} hint="Not yet fully received" icon={<ShoppingCart size={18} />} />
      <StatTile label="Receivables" value={formatCompactMoney(summary.receivablesOutstanding)} hint={`${formatMoney(summary.receivablesOutstanding)} not collected`} icon={<Wallet size={18} />} />
      <StatTile label="Payables" value={formatCompactMoney(summary.payablesOutstanding)} hint={`${formatMoney(summary.payablesOutstanding)} not paid`} icon={<Receipt size={18} />} />
    </div>
  );
};
