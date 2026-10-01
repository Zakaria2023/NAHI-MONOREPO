import { listActivity } from "services";
import { Card } from "ui";
import { ActivityTable } from "@/components/activity/activity-table";

type RecordLogProps = {
  /** The document number, to narrow the log before matching the record. */
  number: string;
  uuid: string;
};

/** Every change to one PR or PO, who made it and when. */
export const RecordLog = async ({ number, uuid }: RecordLogProps) => {
  const entries = (await listActivity({ search: number, limit: 500 })).filter((e) => e.entityUuid === uuid);
  return (
    <Card title="Log" description="Every step, approval and change, and who recorded it">
      <ActivityTable entries={entries} showRecord={false} />
    </Card>
  );
};
