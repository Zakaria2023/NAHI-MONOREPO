import { TimesheetRow } from "services";
import { StatusPill, Table } from "ui";
import { formatDate } from "utils";
import { EMPLOYMENT_TYPE_LABELS } from "@/db/label";

type TimesheetsTableProps = {
  rows: TimesheetRow[];
  /** Project uuid → code, for the split. */
  projectCodes: Record<string, string>;
};

export const TimesheetsTable = ({ rows, projectCodes }: TimesheetsTableProps) => (
  <Table
    data={rows}
    rowKey={(r) => r.employee.uuid}
    columns={[
      {
        key: "employee",
        header: "Employee",
        render: (r) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{r.employee.name}</span>
            <span className="text-xs text-muted">{r.employee.jobTitle}</span>
          </div>
        ),
      },
      { key: "type", header: "Pay", render: (r) => <span className="text-secondary">{EMPLOYMENT_TYPE_LABELS[r.employee.employmentType]}</span> },
      {
        key: "split",
        header: "Days per project",
        wrap: true,
        render: (r) =>
          r.employee.employmentType === "daily" ? (
            <span className="text-secondary">{r.attendanceDays} day(s) from attendance</span>
          ) : r.timesheet ? (
            <span dir="ltr">
              {r.timesheet.allocations
                .map((a) => `${a.projectUuid ? (projectCodes[a.projectUuid] ?? "?") : "Head office"} ${a.days} d`)
                .join(" · ")}
            </span>
          ) : (
            <span className="text-muted">—</span>
          ),
      },
      { key: "absent", header: "Absent", align: "end", render: (r) => r.timesheet?.absentDays ?? "—" },
      { key: "overtime", header: "Overtime (h)", align: "end", render: (r) => r.timesheet?.overtimeHours ?? "—" },
      {
        key: "status",
        header: "Timesheet",
        render: (r) =>
          r.employee.employmentType === "daily" ? (
            <StatusPill tone={r.attendanceDays > 0 ? "success" : "neutral"}>{r.attendanceDays > 0 ? "From attendance" : "No attendance"}</StatusPill>
          ) : r.timesheet ? (
            <div className="flex flex-col gap-0.5">
              <StatusPill tone="success">Recorded</StatusPill>
              <span className="text-xs text-muted">
                {r.timesheet.submittedBy} · {formatDate(r.timesheet.submittedAt)}
              </span>
            </div>
          ) : (
            <StatusPill>Full month assumed</StatusPill>
          ),
      },
    ]}
  />
);
