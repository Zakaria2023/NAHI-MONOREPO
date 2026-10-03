import { listPayrollRuns, listProjectOptions, listTimesheets } from "services";
import { Card } from "ui";
import { formatPeriod } from "utils";
import { saveTimesheetAction } from "@/app/(dashboard)/payroll/timesheets/new/actions";
import { PageHeader } from "@/components/shared/page-header";
import { BlockedNote } from "@/components/warehouse/blocked-note";
import { TimesheetForm } from "./timesheet-form";

type NewTimesheetProps = {
  period: string;
};

/** Finance §6: a monthly employee's days per project, absences and overtime. Saving again replaces it. */
export const NewTimesheet = async ({ period }: NewTimesheetProps) => {
  const [rows, projects, runs] = await Promise.all([listTimesheets(period), listProjectOptions(), listPayrollRuns()]);
  const run = runs.find((r) => r.period === period);
  const closed = Boolean(run && run.status !== "draft");
  const monthly = rows.filter((r) => r.employee.employmentType === "monthly");
  return (
    <>
      <PageHeader
        title={`Timesheet — ${formatPeriod(period)}`}
        description="Days per project, absences and overtime. Without a timesheet, the full month goes to the employee's default project."
        back={{ href: `/payroll/timesheets?period=${period}`, label: "Timesheets & attendance" }}
      />
      {closed ? (
        <BlockedNote reason={`The payroll for ${formatPeriod(period)} is ${run?.status} — its timesheets are closed.`} />
      ) : (
        <Card title="Timesheet">
          <TimesheetForm
            action={saveTimesheetAction.bind(null, period)}
            period={period}
            employees={monthly.map((r) => ({ value: r.employee.uuid, label: `${r.employee.code} — ${r.employee.name}`, hint: r.employee.jobTitle }))}
            projects={[{ value: "", label: "Head office (overhead)" }, ...projects]}
          />
        </Card>
      )}
    </>
  );
};
