import { GuaranteeRow } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { GUARANTEE_KIND_LABELS } from "@/db/label";
import { releaseGuaranteeAction } from "@/app/(dashboard)/finance/guarantees/actions";
import { ActionButton } from "@/components/shared/action-button";

type GuaranteesTableProps = {
  guarantees: GuaranteeRow[];
};

const STATUS = {
  active: { tone: "success", label: "In force" },
  expiring: { tone: "warning", label: "Expiring" },
  expired: { tone: "danger", label: "Expired" },
  released: { tone: "neutral", label: "Released" },
} as const;

export const GuaranteesTable = ({ guarantees }: GuaranteesTableProps) => (
  <Table
    data={guarantees}
    rowKey={(g) => g.uuid}
    emptyMessage="No letters of guarantee recorded."
    columns={[
      {
        key: "number",
        header: "Letter",
        render: (g) => (
          <div className="flex flex-col gap-0.5">
            <span dir="ltr" className="font-medium">
              {g.number}
            </span>
            <span className="text-xs text-muted">{g.bank}</span>
          </div>
        ),
      },
      { key: "kind", header: "Kind", render: (g) => GUARANTEE_KIND_LABELS[g.kind] },
      { key: "beneficiary", header: "Beneficiary", render: (g) => g.beneficiary },
      { key: "project", header: "Project", render: (g) => <span dir="ltr">{g.projectCode ?? "—"}</span> },
      { key: "amount", header: "Amount", align: "end", render: (g) => <span className="font-medium">{formatMoney(g.amount)}</span> },
      { key: "issued", header: "Issued", render: (g) => formatDate(g.issuedAt) },
      {
        key: "expires",
        header: "Expires",
        render: (g) => (
          <div className="flex flex-col gap-0.5">
            <span>{formatDate(g.expiresAt)}</span>
            {(g.status === "active" || g.status === "expiring") && <span className="text-xs text-muted">in {g.daysLeft} day(s)</span>}
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (g) =>
          g.status === "released" ? (
            <StatusPill>{STATUS.released.label}</StatusPill>
          ) : (
            <div className="relative z-10 flex flex-wrap items-center gap-2">
              <StatusPill tone={STATUS[g.status].tone}>{STATUS[g.status].label}</StatusPill>
              <ActionButton action={releaseGuaranteeAction.bind(null, g.uuid)} label="Release" size="sm" variant="outline" />
            </div>
          ),
      },
    ]}
  />
);
