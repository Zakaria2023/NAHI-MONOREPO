import { listActivity } from "services";
import { ActivityTable } from "./activity-table";

type ActivityListProps = {
  search?: string;
};

export const ActivityList = async ({ search }: ActivityListProps) => {
  const entries = await listActivity({ search });
  return <ActivityTable entries={entries} />;
};
