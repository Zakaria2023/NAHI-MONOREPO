import { formatPeriod, recentPeriods } from "utils";
import { TimesheetsBoard } from "@/components/payroll/timesheets-board";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ period?: string }>;
};

const TimesheetsPage = async ({ searchParams }: Props) => {
  const periods = recentPeriods(4);
  const { period: requested } = await searchParams;
  const period = requested && periods.includes(requested) ? requested : periods[0];
  return (
    <>
      <PageHeader
        title="Timesheets & attendance"
        description="Monthly staff record their days per project, absences and overtime; daily workers' days come from the attendance app. Both close when the month's payroll is approved."
      />
      <FilterTabs
        tabs={periods.map((p) => ({ label: formatPeriod(p), href: `/payroll/timesheets?period=${p}`, active: p === period }))}
      />
      <AsyncSection reloadKey={period}>
        <TimesheetsBoard period={period} />
      </AsyncSection>
    </>
  );
};

export default TimesheetsPage;
