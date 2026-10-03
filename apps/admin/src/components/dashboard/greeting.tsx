import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { listAlerts, listPendingApprovals, taskCountsFor } from "services";
import { firstNameOf, formatDate, greetingFor, nowIso } from "utils";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { getCurrentStaff } from "@/lib/server/auth";

/** The dashboard's header: who is signed in, and how much is waiting on them. */
export const Greeting = async () => {
  const actor = await getCurrentStaff();
  const employee = actor.role === "employee";
  const [pending, alerts, tasks] = await Promise.all([listPendingApprovals(actor.role), listAlerts(), taskCountsFor(actor)]);
  const urgent = alerts.filter((a) => a.severity === "danger").length;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-7">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">
          {formatDate(nowIso())} · {STAFF_ROLE_LABELS[actor.role]}
        </span>
        <h1 className="text-3xl font-medium tracking-tight text-ink">
          {greetingFor()}, {firstNameOf(actor.name)}
        </h1>
        {employee ? (
          <p className="text-base text-muted">
            You have <span className="text-ink">{tasks.open} open tasks</span>
            {tasks.unseen > 0 && (
              <>
                , <span className="text-warning">{tasks.unseen} not opened yet</span>
              </>
            )}
            .
          </p>
        ) : (
          <p className="text-base text-muted">
            <span className="text-ink">{pending.length} items</span> are waiting for you, and{" "}
            <span className="text-danger">{urgent} urgent alerts</span> need attention today.
          </p>
        )}
      </div>
      <Link
        href={employee ? "/tasks/my" : "/approvals"}
        className="flex h-10 items-center gap-2 rounded-full bg-primary ps-5 pe-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        {employee ? "Open my tasks" : "Open my approvals"}
        <ArrowRight size={16} className="rtl:-scale-x-100" />
      </Link>
    </div>
  );
};
