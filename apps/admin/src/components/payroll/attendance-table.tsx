import { AttendanceRow } from "services";
import { Table } from "ui";
import { formatDate } from "utils";
import { ATTENDANCE_SOURCE_LABELS } from "@/db/label";

type AttendanceTableProps = {
  entries: AttendanceRow[];
};

export const AttendanceTable = ({ entries }: AttendanceTableProps) => (
  <Table
    data={entries}
    rowKey={(e) => e.uuid}
    pageSize={8}
    emptyMessage="No attendance recorded for this month."
    columns={[
      { key: "date", header: "Day", render: (e) => formatDate(e.date) },
      { key: "worker", header: "Worker", render: (e) => e.employeeName },
      { key: "site", header: "Site", render: (e) => <span dir="ltr">{e.projectCode}</span> },
      { key: "hours", header: "Hours", align: "end", render: (e) => e.hours },
      { key: "source", header: "From", render: (e) => <span className="text-secondary">{ATTENDANCE_SOURCE_LABELS[e.source]}</span> },
    ]}
  />
);
