import { AlertTriangle, CircleAlert, Info } from "lucide-react";
import Link from "next/link";
import { Alert } from "services";
import { EmptyState } from "ui";
import { entityHref } from "@/lib/entity-href";

type AlertListProps = {
  alerts: Alert[];
};

const ICONS = {
  danger: <CircleAlert size={18} className="text-danger" />,
  warning: <AlertTriangle size={18} className="text-warning" />,
  info: <Info size={18} className="text-primary" />,
};

export const AlertList = ({ alerts }: AlertListProps) =>
  alerts.length === 0 ? (
    <EmptyState title="No alerts">Permits, certificates, deliveries and invoices are all on time.</EmptyState>
  ) : (
    <ul className="flex flex-col divide-y divide-hairline-soft">
      {alerts.map((alert) => (
        <li key={alert.key} className="relative flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <span className="mt-0.5">{ICONS[alert.severity]}</span>
          <div className="flex flex-col">
            <Link href={entityHref(alert.target.kind, alert.target.uuid)} className="text-sm text-ink after:absolute after:inset-0 hover:text-primary">
              {alert.title}
            </Link>
            <span className="text-xs text-muted">{alert.detail}</span>
          </div>
        </li>
      ))}
    </ul>
  );
