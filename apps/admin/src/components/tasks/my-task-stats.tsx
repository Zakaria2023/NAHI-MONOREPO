import { AlarmClock, EyeOff, Hourglass, ListTodo, Timer } from "lucide-react";
import { WORK_WEEK_DAYS, listTasks, taskCountsFor } from "services";
import { StatStrip, StatTile } from "ui";
import { getCurrentStaff } from "@/lib/server/auth";

/** The current user's own figures. */
export const MyTaskStats = async () => {
  const actor = await getCurrentStaff();
  const [open, counts] = await Promise.all([listTasks({ assigneeUuid: actor.uuid, view: "open" }), taskCountsFor(actor.uuid)]);
  return (
    <StatStrip columns="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <StatTile tone="primary" href="/tasks/my" label="My open tasks" value={counts.open} hint={`${open.filter((r) => r.status === "in_progress").length} in progress`} icon={<ListTodo size={18} />} />
      <StatTile tone="warning" href="/tasks/my" label="New for me" value={counts.unseen} hint="Not opened yet" icon={<EyeOff size={18} />} />
      <StatTile tone="danger" href={`/tasks?view=overdue&assignee=${actor.uuid}`} label="Overdue" value={open.filter((r) => r.overdue).length} hint="Past their due date" icon={<AlarmClock size={18} />} />
      <StatTile tone="violet" href="/tasks/my?side=given" label="To review" value={counts.toReview} hint="Handed in to me as finished" icon={<Hourglass size={18} />} />
      <StatTile tone="teal" label="Hours logged" value={counts.weekHours} hint={`By me, the last ${WORK_WEEK_DAYS} days`} icon={<Timer size={18} />} />
    </StatStrip>
  );
};
