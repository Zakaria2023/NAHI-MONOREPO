import { getPayrollRun, PAYROLL_CHAIN } from "services";
import { Card, StatStrip, StatTile, StatusPill } from "ui";
import { formatMoney, formatPeriod } from "utils";
import { NATIONALITY_LABELS, PAYROLL_RUN_STATUS_LABELS } from "@/db/label";
import { ChainCard } from "@/components/procurement/chain-card";
import { CsvButton } from "@/components/shared/csv-button";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { getCurrentStaff } from "@/lib/server/auth";
import { PAYROLL_TONES } from "@/lib/status-tones";
import { GosiTable } from "./gosi-table";
import { LaborCostTable } from "./labor-cost-table";
import { PayrollStageCard } from "./payroll-stage-card";
import { PayslipsTable } from "./payslips-table";

type PayrollRunViewProps = {
  uuid: string;
};

export const PayrollRunView = async ({ uuid }: PayrollRunViewProps) => {
  const [{ run, totals, chain, laborCost }, actor] = await Promise.all([getPayrollRun(uuid), getCurrentStaff()]);
  const slips = run.payslips;
  return (
    <>
      <PageHeader
        title={run.number}
        description={`Payroll for ${formatPeriod(run.period)} — ${totals.employees} employees`}
        back={{ href: "/payroll/runs", label: "Payroll" }}
        meta={<StatusPill tone={PAYROLL_TONES[run.status]}>{PAYROLL_RUN_STATUS_LABELS[run.status]}</StatusPill>}
      />
      <StatStrip columns="sm:grid-cols-3 2xl:grid-cols-5">
        <StatTile label="Gross earnings" value={formatMoney(totals.gross)} hint="Salary, allowances, overtime" />
        <StatTile label="Deductions" value={formatMoney(totals.deductions)} hint="Absence and employee GOSI" />
        <StatTile label="Net pay" value={formatMoney(totals.net)} hint="What the bank transfers" />
        <StatTile label="Employer GOSI" value={formatMoney(totals.gosiEmployer)} hint="The company's own share" />
        <StatTile label="Labour cost" value={formatMoney(totals.cost)} hint="Charged to the projects below" />
      </StatStrip>
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card
            title="Payroll register"
            description="One line per employee; open a line for the payslip"
            action={
              <div className="flex flex-wrap gap-2">
                <CsvButton
                  filename={`${run.number}-register`}
                  rows={[
                    ["Code", "Employee", "Job title", "Days", "Basic", "Housing", "Transport", "Overtime", "Gross", "Absence", "GOSI (employee)", "Net"],
                    ...slips.map((p) => [p.employeeCode, p.employeeName, p.jobTitle, p.workedDays, p.basic, p.housing, p.transport, p.overtime, p.gross, p.absenceDeduction, p.gosiEmployee, p.net]),
                  ]}
                />
                <CsvButton
                  filename={`${run.number}-bank-transfer`}
                  label="Bank transfer file"
                  rows={[
                    ["Employee code", "Name", "Bank", "IBAN", "Amount (SAR)", "Reference"],
                    ...slips.map((p) => [p.employeeCode, p.employeeName, p.bankName, p.iban, p.net, `Salary ${run.period}`]),
                  ]}
                />
                <PrintButton />
              </div>
            }
          >
            <PayslipsTable runUuid={run.uuid} payslips={slips} />
          </Card>
          <Card
            title="Social insurance (GOSI)"
            description="Saudi 9.75 % employee + 11.75 % company; non-Saudi 2 % company — on basic + housing"
            action={
              <CsvButton
                filename={`${run.number}-gosi`}
                rows={[
                  ["Code", "Employee", "Nationality", "Contributory wage", "Employee share", "Employer share", "Total"],
                  ...slips.map((p) => [p.employeeCode, p.employeeName, NATIONALITY_LABELS[p.nationality], p.basic + p.housing, p.gosiEmployee, p.gosiEmployer, p.gosiEmployee + p.gosiEmployer]),
                ]}
              />
            }
          >
            <GosiTable payslips={slips} />
          </Card>
          <Card
            title="Labour cost per project"
            description="Each employee's cost split by the days on their timesheet; booked to the manpower budget once approved"
            action={
              <CsvButton
                filename={`${run.number}-labour-cost`}
                rows={[["Project", "Name", "Days", "Cost"], ...laborCost.map((r) => [r.projectCode, r.projectName, r.days, r.amount])]}
              />
            }
          >
            <LaborCostTable rows={laborCost} />
          </Card>
        </div>
        <div className="flex flex-col gap-6 print:hidden">
          <PayrollStageCard run={run} chain={chain} actorRole={actor.role} />
          <ChainCard title="Approval" description="The finance manager signs off the payroll" chain={PAYROLL_CHAIN} approvals={run.approvals} state={chain} />
        </div>
      </div>
    </>
  );
};
