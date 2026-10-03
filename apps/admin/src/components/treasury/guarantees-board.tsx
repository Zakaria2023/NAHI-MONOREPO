import { CalendarClock, HandCoins, ShieldCheck } from "lucide-react";
import { listGuarantees, listSubcontracts } from "services";
import { Card, StatStrip, StatTile, Table } from "ui";
import { formatMoney, round2, sumBy } from "utils";
import { CsvButton } from "@/components/shared/csv-button";
import { GuaranteesTable } from "./guarantees-table";

export const GuaranteesBoard = async () => {
  const [guarantees, subcontracts] = await Promise.all([listGuarantees(), listSubcontracts()]);
  const live = guarantees.filter((g) => g.status === "active" || g.status === "expiring");
  const retentions = subcontracts.filter((s) => s.retentionHeld > 0);
  return (
    <>
      <StatStrip columns="sm:grid-cols-3">
        <StatTile tone="primary" label="Guarantees in force" value={formatMoney(round2(sumBy(live, (g) => g.amount)))} hint={`${live.length} letters`} icon={<ShieldCheck size={18} />} />
        <StatTile
          tone="warning"
          label="Expiring within 30 days"
          value={guarantees.filter((g) => g.status === "expiring").length}
          hint="Renew or release"
          icon={<CalendarClock size={18} />}
        />
        <StatTile
          tone="teal"
          label="Retentions held"
          value={formatMoney(round2(sumBy(retentions, (s) => s.retentionHeld)))}
          hint="On subcontractors' approved extracts"
          icon={<HandCoins size={18} />}
        />
      </StatStrip>
      <Card
        title="Letters of guarantee"
        action={
          <CsvButton
            filename="letters-of-guarantee"
            rows={[
              ["Number", "Bank", "Kind", "Beneficiary", "Project", "Amount", "Issued", "Expires", "Status"],
              ...guarantees.map((g) => [g.number, g.bank, g.kind, g.beneficiary, g.projectCode ?? "", g.amount, g.issuedAt.slice(0, 10), g.expiresAt.slice(0, 10), g.status]),
            ]}
          />
        }
      >
        <GuaranteesTable guarantees={guarantees} />
      </Card>
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <Card title="Retentions held on subcontractors" description="Deducted from each approved extract at the subcontract's rate, released at the end of the work">
          <Table
            data={retentions}
            rowKey={(s) => s.uuid}
            emptyMessage="No retention held."
            columns={[
              {
                key: "number",
                header: "Subcontract",
                render: (s) => (
                  <div className="flex flex-col gap-0.5">
                    <span dir="ltr" className="font-medium">
                      {s.number}
                    </span>
                    <span className="text-xs text-muted">{s.subcontractorName}</span>
                  </div>
                ),
              },
              { key: "project", header: "Project", render: (s) => <span dir="ltr">{s.projectCode}</span> },
              { key: "rate", header: "Rate", align: "end", render: (s) => `${s.retentionPct} %` },
              { key: "certified", header: "Certified", align: "end", render: (s) => formatMoney(s.certified) },
              { key: "held", header: "Held", align: "end", render: (s) => <span className="font-medium">{formatMoney(s.retentionHeld)}</span> },
            ]}
          />
        </Card>
      </div>
    </>
  );
};
