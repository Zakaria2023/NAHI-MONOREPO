import { ArrowRight } from "lucide-react";
import { getTransfer, TRANSFER_CHAIN } from "services";
import { Card, StatusPill } from "ui";
import { formatDate, formatDateTime } from "utils";
import { WAREHOUSE_DOC_STATUS_LABELS } from "@/db/label";
import { decideTransferAction } from "@/app/(dashboard)/warehouse/transfers/[uuid]/actions";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { WAREHOUSE_DOC_TONES } from "@/lib/status-tones";
import { ApprovalCard } from "./approval-card";
import { StockLinesTable } from "./stock-lines-table";

type TransferViewProps = {
  uuid: string;
};

export const TransferView = async ({ uuid }: TransferViewProps) => {
  const { transfer, from, to, lines, chain } = await getTransfer(uuid);
  return (
    <>
      <PageHeader
        title={transfer.number}
        description={`Transfer from ${from.code} (${from.city}) to ${to.code} (${to.city}).`}
        back={{ href: "/warehouse/documents?kind=stock_transfer", label: "Warehouse documents" }}
        meta={<StatusPill tone={WAREHOUSE_DOC_TONES[transfer.status]}>{WAREHOUSE_DOC_STATUS_LABELS[transfer.status]}</StatusPill>}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-muted">From</span>
                  <span className="text-base text-ink" dir="ltr">
                    {from.code}
                  </span>
                  <span className="text-xs text-muted">{from.name}</span>
                </div>
                <ArrowRight size={18} className="text-faint rtl:-scale-x-100" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted">To</span>
                  <span className="text-base text-ink" dir="ltr">
                    {to.code}
                  </span>
                  <span className="text-xs text-muted">{to.name}</span>
                </div>
              </div>
              <FactList
                columns={3}
                facts={[
                  { label: "Requested by", value: transfer.requestedBy },
                  { label: "Requested", value: formatDate(transfer.createdAt) },
                  { label: "Balance moved", value: transfer.completedAt ? formatDateTime(transfer.completedAt) : "On the last approval" },
                ]}
              />
            </div>
          </Card>
          <Card title="Lines" description={`Quantities to move, against what ${from.code} holds now`}>
            <div className="flex flex-col gap-3">
              <StockLinesTable lines={lines} availableLabel={`In ${from.code} now`} showAvailable={transfer.status === "pending_approval"} />
              <p className="text-end text-xs text-muted">{lines.length} line(s)</p>
            </div>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <ApprovalCard
            chain={TRANSFER_CHAIN}
            approvals={transfer.approvals}
            state={chain}
            action={decideTransferAction.bind(null, transfer.uuid)}
            description="Five approvals; the balance moves between the warehouses on the last one"
          />
        </div>
      </div>
    </>
  );
};
