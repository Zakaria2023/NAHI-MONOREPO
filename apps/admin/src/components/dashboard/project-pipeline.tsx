import Link from "next/link";
import { listProjects } from "services";
import { Card, StatusPill } from "ui";
import { OperatorPill } from "@/components/shared/operator-pill";
import { ProgressBar } from "@/components/shared/progress-bar";

/** Mobily §7 / STC §6: every project with its current stage and what is missing. */
export const ProjectPipeline = async () => {
  const projects = await listProjects();
  return (
    <Card
      title="Project pipeline"
      description="Current stage and what is still missing, per PO"
      action={
        <Link href="/projects" className="text-sm text-primary hover:underline">
          All projects
        </Link>
      }
    >
      <ul className="flex flex-col divide-y divide-hairline-soft">
        {projects.map((project) => (
          <li key={project.uuid} className="relative grid grid-cols-1 items-center gap-3 py-3 first:pt-0 last:pb-0 md:grid-cols-12">
            <div className="flex flex-col gap-1 md:col-span-4">
              <div className="flex items-center gap-2">
                <Link href={`/projects/${project.uuid}`} className="text-sm font-medium text-ink after:absolute after:inset-0 hover:text-primary">
                  {project.code}
                </Link>
                <OperatorPill operator={project.operator} />
              </div>
              <span className="line-clamp-1 text-xs text-muted">{project.name}</span>
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-4">
              <span className="text-sm text-ink">{project.stageLabel}</span>
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
