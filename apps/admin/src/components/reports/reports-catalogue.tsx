import { ArrowUpRight, FileBarChart, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { REPORT_GROUPS, listReports } from "services";
import { Card, StatusPill } from "ui";

/** The reports centre: every report, grouped by area, each linking to its report or its screen. */
export const ReportsCatalogue = async () => {
  const reports = await listReports();
  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
      {REPORT_GROUPS.map((group) => (
        <Card key={group} title={group} description={`${reports.filter((r) => r.group === group).length} reports`}>
          <ul className="-mx-2 flex flex-col">
            {reports
              .filter((r) => r.group === group)
              .map((r) => (
                <li key={r.slug} className="group relative flex items-start gap-3 rounded-control px-2 py-2.5 transition-colors hover:bg-hover">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control ${r.built ? "bg-primary-tint text-primary" : "bg-teal-tint text-teal"}`}
                  >
                    {r.built ? <FileBarChart size={16} /> : <MonitorSmartphone size={16} />}
                  </span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <Link href={r.built ? `/reports/${r.slug}` : (r.href ?? "/reports")} className="text-sm font-medium text-ink after:absolute after:inset-0">
                        {r.title}
                      </Link>
                      {!r.built && <StatusPill>Screen</StatusPill>}
                    </span>
                    <span className="text-xs text-muted">{r.description}</span>
                    <span className="text-xs text-faint">{r.source}</span>
                  </div>
                  <ArrowUpRight size={16} className="mt-1 shrink-0 text-faint transition-colors group-hover:text-primary" />
                </li>
              ))}
          </ul>
        </Card>
      ))}
    </div>
  );
};
