import { Project } from "services";
import { Card } from "ui";
import { formatDate, formatMoney } from "utils";
import { REGION_LABELS } from "@/db/label";
import { FactList } from "@/components/shared/fact-list";

type ProjectFactsProps = {
  project: Project;
};

export const ProjectFacts = ({ project }: ProjectFactsProps) => (
  <Card>
    <FactList
      columns={4}
      facts={[
        { label: "Site", value: <span dir="ltr">{project.siteName}</span> },
        { label: "City / region", value: `${project.city} · ${REGION_LABELS[project.region]}` },
        { label: "Customer PO", value: <span dir="ltr">{project.poNumber ?? "Not issued yet"}</span> },
        { label: "PO value", value: formatMoney(project.poValue) },
        { label: "Project manager", value: project.projectManagerName },
        { label: "Created", value: formatDate(project.createdAt) },
      ]}
    />
  </Card>
);
