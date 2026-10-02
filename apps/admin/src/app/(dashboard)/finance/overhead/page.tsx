import { formatPeriod, recentPeriods } from "utils";
import { OVERHEAD_BASIS_LABELS } from "@/db/label";
import { OverheadBasis, overheadBases } from "@/db/enum";
import { OverheadBoard } from "@/components/costs/overhead-board";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ period?: string; basis?: string }>;
};

const OverheadPage = async ({ searchParams }: Props) => {
  const periods = recentPeriods(6);
  const { period: requested, basis: requestedBasis } = await searchParams;
  const period = requested && periods.includes(requested) ? requested : periods[1];
  const basis: OverheadBasis = overheadBases.find((b) => b === requestedBasis) ?? "direct_cost";
  return (
    <>
      <PageHeader
        title="Overhead allocation"
        description="Each month's head-office cost — expenses charged to departments and vehicles, the head-office payroll, the depreciation of head-office assets — spread over the projects on a set basis and charged to their overhead budget."
      />
      <div className="flex flex-col gap-3">
        <FilterTabs
          tabs={periods.map((p) => ({ label: formatPeriod(p), href: `/finance/overhead?period=${p}&basis=${basis}`, active: p === period }))}
        />
        <FilterTabs
          tabs={overheadBases.map((b) => ({ label: OVERHEAD_BASIS_LABELS[b], href: `/finance/overhead?period=${period}&basis=${b}`, active: b === basis }))}
        />
      </div>
      <AsyncSection reloadKey={`${period}-${basis}`}>
        <OverheadBoard period={period} basis={basis} />
      </AsyncSection>
    </>
  );
};

export default OverheadPage;
