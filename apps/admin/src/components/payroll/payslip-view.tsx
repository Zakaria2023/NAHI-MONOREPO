import { COMPANY_PROFILE, getPayslip } from "services";
import { Card, StatusPill } from "ui";
import { formatMoney, formatPeriod } from "utils";
import { EMPLOYMENT_TYPE_LABELS, NATIONALITY_LABELS, PAYROLL_RUN_STATUS_LABELS } from "@/db/label";
import { FigureRow } from "@/components/finance/figure-row";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { PAYROLL_TONES } from "@/lib/status-tones";

type PayslipViewProps = {
  runUuid: string;
  employeeUuid: string;
};

/** One employee's payslip, laid out to be printed or saved as PDF. */
export const PayslipView = async ({ runUuid, employeeUuid }: PayslipViewProps) => {
  const { run, payslip: p, allocations } = await getPayslip(runUuid, employeeUuid);
  return (
    <>
      <PageHeader
        title={`Payslip — ${p.employeeName}`}
        description={`${formatPeriod(run.period)} · ${run.number}`}
        back={{ href: `/payroll/runs/${run.uuid}`, label: run.number }}
        meta={<StatusPill tone={PAYROLL_TONES[run.status]}>{PAYROLL_RUN_STATUS_LABELS[run.status]}</StatusPill>}
      />
      <Card action={<PrintButton />} title={COMPANY_PROFILE.name} description={`Salary slip for ${formatPeriod(run.period)}`}>
        <div className="flex flex-col gap-6">
          <FactList
            columns={4}
            facts={[
              { label: "Employee", value: `${p.employeeName} (${p.employeeCode})` },
              { label: "Job title", value: p.jobTitle },
              { label: "Nationality", value: NATIONALITY_LABELS[p.nationality] },
              { label: "Paid", value: EMPLOYMENT_TYPE_LABELS[p.employmentType] },
              { label: "Days worked", value: p.workedDays },
              { label: "Days absent", value: p.absentDays },
              { label: "Overtime hours", value: p.overtimeHours },
              { label: "Paid to", value: <span dir="ltr">{`${p.bankName} · ${p.iban}`}</span> },
            ]}
          />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="flex flex-col">
              <span className="mb-2 text-xs font-medium text-muted">Earnings</span>
              <FigureRow label={p.employmentType === "daily" ? "Days × daily rate" : "Basic salary"} amount={p.basic} />
              {p.housing > 0 && <FigureRow label="Housing allowance" amount={p.housing} />}
              {p.transport > 0 && <FigureRow label="Transport allowance" amount={p.transport} />}
              {p.overtime > 0 && <FigureRow label={`Overtime (${p.overtimeHours} h × 1.5)`} amount={p.overtime} />}
              <FigureRow label="Gross earnings" amount={p.gross} emphasis />
            </div>
            <div className="flex flex-col">
              <span className="mb-2 text-xs font-medium text-muted">Deductions</span>
              <FigureRow label={`Absence (${p.absentDays} day(s))`} amount={p.absenceDeduction} sign="−" />
              <FigureRow label="GOSI — employee share" amount={p.gosiEmployee} sign="−" />
              <FigureRow label="Net pay" amount={p.net} sign="=" emphasis tone="success" />
            </div>
          </div>
          <p className="text-sm text-muted">
            The company also pays {formatMoney(p.gosiEmployer)} social insurance on this salary. Cost charged to:{" "}
            {allocations.map((a) => `${a.projectCode} ${formatMoney(a.amount)}`).join(" · ")}.
          </p>
        </div>
      </Card>
    </>
  );
};
