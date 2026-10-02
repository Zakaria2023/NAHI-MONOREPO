import { CostCenterRow } from "services";
import { StatusPill, Table } from "ui";
import { formatMoney } from "utils";
import { COST_CENTER_KIND_LABELS } from "@/db/label";

type CostCentersTableProps = {
  centres: CostCenterRow[];
};

export const CostCentersTable = ({ centres }: CostCentersTableProps) => (
  <Table
    data={centres}
    rowKey={(c) => c.uuid}
    pageSize={8}
    columns={[
      {
        key: "code",
        header: "Cost centre",
        render: (c) => (
          <div className="flex flex-col gap-0.5">
            <span dir="ltr" className="font-medium">
              {c.code}
            </span>
            <span className="text-xs text-muted">{c.name}</span>
          </div>
        ),
      },
      {
        key: "kind",
        header: "Kind",
        render: (c) => <StatusPill tone={c.kind === "project" ? "info" : c.kind === "vehicle" ? "warning" : "neutral"}>{COST_CENTER_KIND_LABELS[c.kind]}</StatusPill>,
      },
      { key: "charged", header: "Expenses charged", align: "end", render: (c) => (c.charged > 0 ? formatMoney(c.charged) : "—") },
    ]}
  />
);
