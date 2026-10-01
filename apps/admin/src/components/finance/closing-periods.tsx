import { listClosingPeriods } from "services";
import { getCurrentStaff } from "@/lib/server/auth";
import { ClosingPeriodCard } from "./closing-period-card";

export const ClosingPeriods = async () => {
  const [periods, actor] = await Promise.all([listClosingPeriods(), getCurrentStaff()]);
  return (
    <div className="flex flex-col gap-6">
      {periods.map((view) => (
        <ClosingPeriodCard key={view.period} view={view} canCloseRole={actor.role === "finance_manager"} />
      ))}
    </div>
  );
};
