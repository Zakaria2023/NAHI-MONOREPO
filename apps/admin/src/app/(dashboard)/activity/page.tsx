import { ActivityList } from "@/components/activity/activity-list";
import { AsyncSection } from "@/components/shared/async-section";
import { ListSearch } from "@/components/shared/list-search";
import { PageHeader } from "@/components/shared/page-header";

type Props = {
  searchParams: Promise<{ search?: string }>;
};

const ActivityPage = async ({ searchParams }: Props) => {
  const { search } = await searchParams;
  return (
    <>
      <PageHeader title="Activity log" description="Every change, with its date, who made it and what it was about — the audit log the documents ask for." />
      <ListSearch placeholder="Search by number, action or person…" defaultValue={search} />
      <AsyncSection reloadKey={`activity-${search ?? ""}`}>
        <ActivityList search={search} />
      </AsyncSection>
    </>
  );
};

export default ActivityPage;
