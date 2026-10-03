import { CalendarClock, HardHat, Users, Wallet } from "lucide-react";
import { listEmployees, listProjectOptions } from "services";
import { Card, StatStrip, StatTile } from "ui";
import { formatMoney, round2, sumBy } from "utils";
import { EmployeeForm } from "./employee-form";
import { EmployeeLoginForm } from "./employee-login-form";
import { EmployeesTable } from "./employees-table";

export const EmployeesBoard = async () => {
  const [employees, projects] = await Promise.all([listEmployees(), listProjectOptions()]);
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
      <Card title="Add an employee" description="The IBAN is where the salary transfer goes; the default project takes the cost when a timesheet does not split it">
        <EmployeeForm key={employees.length} projects={[{ value: "", label: "Head office (overhead)" }, ...projects]} />
      </Card>
      <Card title="Give an employee a sign-in" description="They sign in with this e-mail and password and see their own tasks — nothing else">
        <EmployeeLoginForm
          key={employees.filter((e) => e.loginEmail).length}
          employees={employees.filter((e) => e.active && !e.loginEmail).map((e) => ({ value: e.uuid, label: `${e.name} — ${e.jobTitle}` }))}
        />
      </Card>
    </>
  );
};
