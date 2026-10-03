import { AlarmClock, CheckCircle2, EyeOff, Hourglass, ListTodo } from "lucide-react";
import { listTasks } from "services";
import { StatStrip, StatTile } from "ui";
import { round2, sumBy } from "utils";

type TaskStatsProps = {
  assigneeUuid?: string;
};

/** The whole team's tasks — or one person's, when the list is filtered to them. */
export const TaskStats = async ({ assigneeUuid }: TaskStatsProps) => {
  const rows = await listTasks({ assigneeUuid });
  const open = rows.filter((r) => r.status !== "done" && r.status !== "cancelled");
  const done = rows.filter((r) => r.status === "done");
  const avgDays = done.length ? round2(sumBy(done, (r) => r.clock.workingDays ?? 0) / done.length) : 0;
  const onTime = done.filter((r) => r.clock.lateDays === 0).length;
  const query = assigneeUuid ? `&assignee=${assigneeUuid}` : "";
  return (
    <StatStrip columns="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <StatTile tone="primary" href={`/tasks?view=open${query}`} label="Open" value={open.length} hint={`${open.filter((r) => r.status === "in_progress").length} in progress`} icon={<ListTodo size={18} />} />
      <StatTile tone="warning" href={`/tasks?view=unseen${query}`} label="Not seen yet" value={open.filter((r) => !r.seenAt).length} hint="Given, and not opened by the assignee" icon={<EyeOff size={18} />} />
      <StatTile tone="danger" href={`/tasks?view=overdue${query}`} label="Overdue" value={rows.filter((r) => r.overdue).length} hint="Open past their due date" icon={<AlarmClock size={18} />} />
      <StatTile tone="violet" href={`/tasks?view=in_review${query}`} label="Waiting for review" value={rows.filter((r) => r.status === "in_review").length} hint="Handed in as finished" icon={<Hourglass size={18} />} />
      <StatTile tone="success" href={`/tasks?view=done${query}`} label="Done" value={done.length} hint={done.length ? `${onTime} on time · ${avgDays} working days on average` : "None finished yet"} icon={<CheckCircle2 size={18} />} />
    </StatStrip>
  );
};
