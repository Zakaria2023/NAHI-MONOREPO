import Link from "next/link";
import { listProjects } from "services";
import { StatusPill, Table } from "ui";
import { formatMoney } from "utils";
import { Operator } from "@/db/enum";
import { OperatorPill } from "@/components/shared/operator-pill";
import { ProgressBar } from "@/components/shared/progress-bar";

type ProjectsTableProps = {
  operator?: Operator;
  search?: string;
};

export const ProjectsTable = async ({ operator, search }: ProjectsTableProps) => {
  const projects = await listProjects({ operator, search });
  return (
    <Table
      data={projects}
      rowKey={(p) => p.uuid}
      emptyMessage="No project matches."
      columns={[
        {
          key: "code",
          header: "Project",
          render: (p) => (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Link href={`/projects/${p.uuid}`} className="font-medium text-ink after:absolute after:inset-0 hover:text-primary">
                  {p.code}
                </Link>
                <OperatorPill operator={p.operator} />
              </div>
              <span className="text-xs text-muted">{p.name}</span>
            </div>
          ),
        },
        {
          key: "site",
          header: "Site",
          render: (p) => (
            <div className="flex flex-col">
              <span dir="ltr">{p.siteName}</span>
              <span className="text-xs text-muted">{p.city}</span>
            </div>
          ),
        },
        {
          key: "po",
          header: "PO",
          render: (p) => (
            <div className="flex flex-col">
              <span dir="ltr">{p.poNumber ?? "—"}</span>
              <span className="text-xs text-muted">{formatMoney(p.poValue)}</span>
            </div>
          ),
        },
        {
          key: "stage",
          header: "Current stage",
          render: (p) => (
            <div className="flex w-48 flex-col gap-1.5">
              {p.closed ? <StatusPill tone="success">{p.stageLabel}</StatusPill> : <span>{p.stageLabel}</span>}
              <ProgressBar value={p.progress} />
            </div>
          ),
        },
        {
          key: "missing",
          header: "Missing", wrap: true,
          render: (p) =>
            p.missing.length === 0 ? (
              <span className="text-muted">—</span>
            ) : (
              <span className="line-clamp-2 max-w-xs text-xs text-muted">{p.missing.join(" · ")}</span>
            ),
        },
        { key: "pm", header: "PM", render: (p) => <span className="text-secondary">{p.projectManagerName}</span> },
      ]}
    />
  );
};
