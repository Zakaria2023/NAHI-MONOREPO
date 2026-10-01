import { AlertTriangle, ChevronRight, CircleAlert, Info } from "lucide-react";
import Link from "next/link";
import { Alert } from "services";
import { EmptyState } from "ui";
import { entityHref } from "@/lib/entity-href";

type AlertListProps = {
  alerts: Alert[];
};

const ICONS = {
  danger: <CircleAlert size={17} />,
  warning: <AlertTriangle size={17} />,
  info: <Info size={17} />,
};

const CHIPS = {
  danger: "bg-danger-tint text-danger",
  warning: "bg-warning-tint text-warning",
  info: "bg-primary-tint text-primary",
};

export const AlertList = ({ alerts }: AlertListProps) =>
  alerts.length === 0 ? (
    <EmptyState title="No alerts">Permits, certificates, deliveries and invoices are all on time.</EmptyState>
  ) : (
    <ul className="-mx-2 flex flex-col">
      {alerts.map((alert) => (
        <li key={alert.key} className="group relative flex items-center gap-3 rounded-control px-2 py-2.5 transition-colors hover:bg-hover">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${CHIPS[alert.severity]}`}>
            {ICONS[alert.severity]}
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <Link href={entityHref(alert.target.kind, alert.target.uuid)} className="text-sm font-medium text-ink after:absolute after:inset-0">
              {alert.title}
            </Link>
            <span className="text-xs text-muted">{alert.detail}</span>
          </div>
          <ChevronRight size={16} className="shrink-0 text-faint transition-colors group-hover:text-secondary rtl:-scale-x-100" />
        </li>
      ))}
    </ul>
  );
