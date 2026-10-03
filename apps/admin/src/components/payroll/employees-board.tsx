import { CalendarClock, HardHat, Users, Wallet } from "lucide-react";
import { listEmployees } from "services";
import { StatStrip, StatTile } from "ui";
import { formatMoney, round2, sumBy } from "utils";
import { EmployeesTable } from "./employees-table";

export const EmployeesBoard = async () => {
  const employees = await listEmployees();
  const active = employees.filter((e) => e.active);
  const daily = active.filter((e) => e.employmentType === "daily");
  return (
    <>
      <StatStrip columns="sm:grid-cols-2 xl:grid-cols-4">
        <StatTile tone="primary" label="Employees" value={active.length} hint={`${active.filter((e) => e.nationality === "saudi").length} Saudi`} icon={<Users size={18} />} />
        <StatTile tone="teal" label="Daily workers" value={daily.length} hint="Paid by attended days" icon={<HardHat size={18} />} />
        <StatTile
          tone="violet"
          label="Monthly payroll cost"
          value={formatMoney(round2(sumBy(active, (e) => e.monthlyCost)))}
          hint="Full month, employer GOSI included"
          icon={<Wallet size={18} />}
        />
        <StatTile tone="warning" href="/payroll/timesheets" label="Timesheets" value="Open" hint="Record this month's days" icon={<CalendarClock size={18} />} />
      </StatStrip>
      <EmployeesTable employees={employees} />
    </>
  );
};
