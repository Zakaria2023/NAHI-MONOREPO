import { getWriteOff, WRITE_OFF_CHAIN } from "services";
import { Card, StatusPill } from "ui";
import { formatDate, formatMoney } from "utils";
import { WAREHOUSE_DOC_STATUS_LABELS, WRITE_OFF_DECISION_LABELS, WRITE_OFF_REASON_LABELS } from "@/db/label";
import { decideWriteOffAction } from "@/app/(dashboard)/warehouse/write-offs/[uuid]/actions";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { WAREHOUSE_DOC_TONES } from "@/lib/status-tones";
import { ApprovalCard } from "./approval-card";
import { StockLinesTable } from "./stock-lines-table";

type WriteOffViewProps = {
  uuid: string;
};

export const WriteOffView = async ({ uuid }: WriteOffViewProps) => {
  const { writeOff, warehouse, lines, value, chain } = await getWriteOff(uuid);
  return (
    <>
      <PageHeader
        title={writeOff.number}
        description={`${WRITE_OFF_REASON_LABELS[writeOff.reason]} stock in ${warehouse.code} — ${WRITE_OFF_DECISION_LABELS[writeOff.decision].toLowerCase()}.`}
        back={{ href: "/warehouse/documents?kind=write_off", label: "Warehouse documents" }}
        meta={<StatusPill tone={WAREHOUSE_DOC_TONES[writeOff.status]}>{WAREHOUSE_DOC_STATUS_LABELS[writeOff.status]}</StatusPill>}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card title="Investigation and decision" description="Damage, loss or theft is investigated before it is written off or charged">
            <div className="flex flex-col gap-5">
              <FactList
                columns={3}
                facts={[
                  { label: "Warehouse", value: `${warehouse.code} — ${warehouse.name}` },
                  { label: "Reason", value: <StatusPill tone="danger">{WRITE_OFF_REASON_LABELS[writeOff.reason]}</StatusPill> },
                  { label: "Decision", value: WRITE_OFF_DECISION_LABELS[writeOff.decision] },
                  { label: "Employee charged", value: writeOff.chargedEmployee ?? "—" },
                  { label: "Raised by", value: writeOff.requestedBy },
                  { label: "Raised", value: formatDate(writeOff.createdAt) },
                ]}
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted">Investigation summary</span>
                <p className="text-sm whitespace-pre-line text-ink">{writeOff.investigation}</p>
              </div>
            </div>
          </Card>
          <Card title="Lines" description="Valued at the item's average cost">
            <div className="flex flex-col gap-3">
              <StockLinesTable lines={lines} availableLabel={`In ${warehouse.code} now`} showAvailable={writeOff.status === "pending_approval"} />
              <div className="flex items-center justify-end gap-3 text-sm">
                <span className="text-muted">Value written off</span>
                <span className="text-base font-medium text-ink">{formatMoney(value)}</span>
              </div>
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <ApprovalCard
            chain={WRITE_OFF_CHAIN}
            approvals={writeOff.approvals}
            state={chain}
            action={decideWriteOffAction.bind(null, writeOff.uuid)}
            description="Six approvals; the stock leaves the warehouse on the last one"
            approveLabel="Approve write-off"
          />
        </div>
      </div>
    </>
  );
};
