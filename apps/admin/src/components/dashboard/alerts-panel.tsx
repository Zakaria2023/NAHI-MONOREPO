import Link from "next/link";
import { listAlerts } from "services";
import { Card } from "ui";
import { AlertList } from "@/components/shared/alert-list";

export const AlertsPanel = async () => {
  const alerts = await listAlerts();
  return (
    <Card
      title="Alerts"
      description="Permits, FAC, final clearance, deliveries, custody and invoices"
      action={
        <Link href="/alerts" className="flex h-8 shrink-0 items-center rounded-full border border-hairline px-3.5 text-xs font-medium text-ink transition-colors hover:border-search-border hover:bg-hover">
          View all
        </Link>
      }
    >
      <AlertList alerts={alerts.slice(0, 6)} />
    </Card>
  );
};
