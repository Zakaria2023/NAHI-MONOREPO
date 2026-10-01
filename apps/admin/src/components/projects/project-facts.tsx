import { Project } from "services";
import { StatStrip } from "ui";
import { formatDate, formatMoney } from "utils";
import { REGION_LABELS } from "@/db/label";

type ProjectFactsProps = {
  project: Project;
};

export const ProjectFacts = ({ project }: ProjectFactsProps) => (
  <StatStrip columns="sm:grid-cols-3 2xl:grid-cols-6">
    {[
      { label: "Site", value: <span dir="ltr">{project.siteName}</span> },
      { label: "City / region", value: `${project.city} · ${REGION_LABELS[project.region]}` },
      { label: "Customer PO", value: <span dir="ltr">{project.poNumber ?? "Not issued yet"}</span> },
      { label: "PO value", value: formatMoney(project.poValue) },
      { label: "Project manager", value: project.projectManagerName },
      { label: "Created", value: formatDate(project.createdAt) },
    ].map((fact) => (
      <div key={fact.label} className="flex flex-col gap-1 bg-surface px-6 py-4">
        <span className="text-xs text-muted">{fact.label}</span>
        <span className="text-sm font-medium text-ink">{fact.value}</span>
      </div>
    ))}
  </StatStrip>
);
