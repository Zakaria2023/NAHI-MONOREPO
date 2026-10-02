import { formatPeriod, recentPeriods } from "utils";
import { DepreciationBoard } from "@/components/assets/depreciation-board";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ period?: string }>;
};

const DepreciationPage = async ({ searchParams }: Props) => {
  const periods = recentPeriods(6);
  const { period: requested } = await searchParams;
  const period = requested && periods.includes(requested) ? requested : periods[0];
  return (
    <>
      <PageHeader
        title="Depreciation"
        description="Each month's straight-line depreciation, worked out from the asset cards and posted once — the monthly closing will not tick depreciation until the month is posted."
      />
      <FilterTabs
        tabs={periods.map((p) => ({ label: formatPeriod(p), href: `/finance/depreciation?period=${p}`, active: p === period }))}
      />
      <AsyncSection reloadKey={period}>
        <DepreciationBoard period={period} />
      </AsyncSection>
    </>
  );
};

export default DepreciationPage;
