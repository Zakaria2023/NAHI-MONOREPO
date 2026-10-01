import { listAlerts } from "services";
import { Card } from "ui";
import { AlertList } from "@/components/shared/alert-list";

export const AlertsBoard = async () => {
  const alerts = await listAlerts();
  const groups = [
    { title: "Urgent", alerts: alerts.filter((a) => a.severity === "danger") },
    { title: "Coming up", alerts: alerts.filter((a) => a.severity === "warning") },
    { title: "For information", alerts: alerts.filter((a) => a.severity === "info") },
  ];
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.title} title={`${group.title} (${group.alerts.length})`}>
          <AlertList alerts={group.alerts} />
        </Card>
      ))}
    </div>
  );
};
