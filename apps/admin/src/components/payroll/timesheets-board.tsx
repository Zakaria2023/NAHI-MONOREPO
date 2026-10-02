import { CalendarCheck, Fingerprint, Lock, Users } from "lucide-react";
import { listAttendance, listEmployees, listPayrollRuns, listProjectOptions, listTimesheets } from "services";
import { Card, StatStrip, StatTile } from "ui";
import { formatPeriod } from "utils";
import { PAYROLL_RUN_STATUS_LABELS } from "@/db/label";
import { BlockedNote } from "@/components/procurement/blocked-note";
import { AttendanceForm } from "./attendance-form";
import { AttendanceTable } from "./attendance-table";
import { TimesheetForm } from "./timesheet-form";
import { TimesheetsTable } from "./timesheets-table";

type TimesheetsBoardProps = {
  period: string;
};

export const TimesheetsBoard = async ({ period }: TimesheetsBoardProps) => {
  const [rows, attendance, employees, projects, runs] = await Promise.all([
    listTimesheets(period),
    listAttendance(period),
    listEmployees(),
    listProjectOptions(),
    listPayrollRuns(),
  ]);
  const run = runs.find((r) => r.period === period);
  const closed = Boolean(run && run.status !== "draft");
  const monthlyRows = rows.filter((r) => r.employee.employmentType === "monthly");
  const projectCodes = Object.fromEntries(projects.map((p) => [p.value, p.label.split(" — ")[0]]));
  const workers = employees.filter((e) => e.active && e.employmentType === "daily");
  return (
    <>
      <StatStrip columns="sm:grid-cols-2 xl:grid-cols-4">
        <StatTile tone="primary" label="Monthly staff" value={monthlyRows.length} hint="On this month's payroll" icon={<Users size={18} />} />
        <StatTile
          tone="success"
          label="Timesheets recorded"
          value={`${monthlyRows.filter((r) => r.timesheet).length} / ${monthlyRows.length}`}
          hint="Without one, the full month goes to the default project"
          icon={<CalendarCheck size={18} />}
        />
        <StatTile tone="teal" label="Attendance days" value={attendance.length} hint={`Daily workers, ${formatPeriod(period)}`} icon={<Fingerprint size={18} />} />
        <StatTile
          tone={closed ? "danger" : "warning"}
          href={run ? `/payroll/runs/${run.uuid}` : "/payroll/runs"}
          label="Payroll"
          value={run ? PAYROLL_RUN_STATUS_LABELS[run.status] : "Not run"}
          hint={closed ? "Timesheets are closed for the month" : "Timesheets can still change"}
          icon={<Lock size={18} />}
        />
      </StatStrip>
      <TimesheetsTable rows={rows} projectCodes={projectCodes} />
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <Card title="Record a timesheet" description={`${formatPeriod(period)} — days per project, absences and overtime; saving again replaces it`}>
          {closed ? (
            <BlockedNote>The payroll for this month is {run?.status} — its timesheets are closed.</BlockedNote>
          ) : (
            <TimesheetForm
              key={`${period}-${rows.filter((r) => r.timesheet).length}`}
              period={period}
              employees={monthlyRows.map((r) => ({ value: r.employee.uuid, label: `${r.employee.code} — ${r.employee.name}`, hint: r.employee.jobTitle }))}
              projects={[{ value: "", label: "Head office (overhead)" }, ...projects]}
            />
          )}
        </Card>
        <Card title="Attendance" description="Daily workers — normally sent by the attendance app; entered here when the app is not used">
          <div className="flex flex-col gap-6">
            <AttendanceTable entries={attendance} />
            {!closed && (
              <AttendanceForm
                key={attendance.length}
                workers={workers.map((w) => ({ value: w.uuid, label: `${w.code} — ${w.name}`, hint: w.jobTitle }))}
                projects={projects}
              />
            )}
          </div>
        </Card>
      </div>
    </>
  );
};
