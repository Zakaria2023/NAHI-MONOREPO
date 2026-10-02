import { Landmark, ShieldCheck, Wallet } from "lucide-react";
import { listPayrollRuns } from "services";
import { Card, StatStrip, StatTile } from "ui";
import { formatMoney, formatPeriod, recentPeriods } from "utils";
import { PayrollRunForm } from "./payroll-run-form";
import { PayrollRunsTable } from "./payroll-runs-table";

export const PayrollRunsBoard = async () => {
  const runs = await listPayrollRuns();
  const latest = runs[0];
  const open = recentPeriods(3).filter((p) => !runs.some((r) => r.period === p));
  return (
    <>
      <StatStrip columns="sm:grid-cols-3">
        <StatTile
          tone="primary"
          label="Latest net payroll"
          value={latest ? formatMoney(latest.totals.net) : "—"}
          hint={latest ? `${formatPeriod(latest.period)} · ${latest.totals.employees} employees` : "No run yet"}
          icon={<Wallet size={18} />}
        />
        <StatTile
          tone="violet"
          label="Labour cost"
          value={latest ? formatMoney(latest.totals.cost) : "—"}
          hint="Gross less absence, plus employer GOSI"
          icon={<Landmark size={18} />}
        />
        <StatTile
          tone="teal"
          label="Social insurance"
          value={latest ? formatMoney(latest.totals.gosiEmployee + latest.totals.gosiEmployer) : "—"}
          hint="Employee and employer GOSI, due by the 15th"
          icon={<ShieldCheck size={18} />}
        />
      </StatStrip>
      <PayrollRunsTable runs={runs} />
      <Card title="Run payroll" description="Calculates every active employee's payslip for the month; a draft can be recalculated until it is approved">
        {open.length > 0 ? (
          <PayrollRunForm key={runs.length} periods={open.map((p) => ({ value: p, label: formatPeriod(p) }))} />
        ) : (
          <p className="text-sm text-muted">Payroll has been run for every recent month.</p>
        )}
      </Card>
    </>
  );
};
