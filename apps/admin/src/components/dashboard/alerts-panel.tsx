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
        <Link href="/alerts" className="text-sm text-primary hover:underline">
          View all
        </Link>
      }
    >
      <AlertList alerts={alerts.slice(0, 6)} />
    </Card>
  );
};
