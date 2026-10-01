import Link from "next/link";
import { listProjects } from "services";
import { Card, StatusPill } from "ui";
import { OperatorMark } from "@/components/shared/operator-mark";
import { ProgressBar } from "@/components/shared/progress-bar";

/** Mobily §7 / STC §6: every project with its current stage and what is missing. */
export const ProjectPipeline = async () => {
  const projects = await listProjects();
  return (
    <Card
      title="Project pipeline"
      description="Current stage and what is still missing, per PO"
      action={
        <Link href="/projects" className="flex h-8 shrink-0 items-center rounded-full border border-hairline px-3.5 text-xs font-medium text-ink transition-colors hover:border-search-border hover:bg-hover">
          All projects
        </Link>
      }
    >
      <ul className="-my-1 flex flex-col divide-y divide-hairline-soft">
        {projects.map((project) => (
          <li key={project.uuid} className="relative grid grid-cols-1 items-center gap-x-6 gap-y-3 py-3.5 md:grid-cols-12">
            <div className="flex items-center gap-3 md:col-span-4">
              <OperatorMark operator={project.operator} />
              <div className="flex flex-col gap-0.5">
                <Link href={`/projects/${project.uuid}`} className="text-sm font-medium text-ink after:absolute after:inset-0 hover:text-primary">
                  {project.code}
                </Link>
                <span className="line-clamp-1 text-xs text-muted">{project.name}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-4">
              <span className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">{project.stageLabel}</span>
                <span className="text-xs text-muted tabular-nums">{Math.round(project.progress * 100)}%</span>
              </span>
              <ProgressBar value={project.progress} />
            </div>
            <div className="md:col-span-4 md:text-end">
              {project.closed ? (
                <StatusPill tone="success">Complete</StatusPill>
              ) : (
                <span className="line-clamp-2 text-xs text-muted">
                  {project.missing.length === 0 ? "Ready for the next step" : project.missing.slice(0, 2).join(" · ")}
                  {project.missing.length > 2 && ` · +${project.missing.length - 2} more`}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};
