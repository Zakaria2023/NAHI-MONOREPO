import { recentPeriods } from "utils";
import { NewTimesheet } from "@/components/payroll/new-timesheet";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  searchParams: Promise<{ period?: string }>;
};

const NewTimesheetPage = async ({ searchParams }: Props) => {
  const periods = recentPeriods(4);
  const { period: requested } = await searchParams;
  const period = requested && periods.includes(requested) ? requested : periods[0];
  return (
    <AsyncSection reloadKey={`new-timesheet-${period}`}>
      <NewTimesheet period={period} />
    </AsyncSection>
  );
};

export default NewTimesheetPage;
