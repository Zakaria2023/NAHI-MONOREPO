import { getStocktake, STOCKTAKE_CHAIN } from "services";
import { Card, StatusPill } from "ui";
import { formatDate } from "utils";
import { WAREHOUSE_DOC_STATUS_LABELS } from "@/db/label";
import { decideStocktakeAction } from "@/app/(dashboard)/warehouse/stocktakes/[uuid]/actions";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { WAREHOUSE_DOC_TONES } from "@/lib/status-tones";
import { ApprovalCard } from "./approval-card";
import { StocktakeLinesTable } from "./stocktake-lines-table";

type StocktakeViewProps = {
  uuid: string;
};

export const StocktakeView = async ({ uuid }: StocktakeViewProps) => {
  const { stocktake, warehouse, lines, chain } = await getStocktake(uuid);
  const differing = lines.filter((l) => l.difference !== 0);
  return (
    <>
      <PageHeader
        title={stocktake.number}
        description={`Stocktake of ${warehouse.code} — ${warehouse.name}.`}
        back={{ href: "/warehouse/documents?kind=stocktake", label: "Warehouse documents" }}
        meta={<StatusPill tone={WAREHOUSE_DOC_TONES[stocktake.status]}>{WAREHOUSE_DOC_STATUS_LABELS[stocktake.status]}</StatusPill>}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <FactList
              columns={4}
              facts={[
                { label: "Warehouse", value: `${warehouse.code} — ${warehouse.city}` },
                { label: "Counted on", value: formatDate(stocktake.countedAt) },
                { label: "Counted by", value: stocktake.countedBy },
                {
                  label: "Differences",
                  value:
                    differing.length === 0 ? (
                      <span className="text-success">None — book matches the shelf</span>
                    ) : (
                      <span className="text-warning">{differing.length} item(s) differ</span>
                    ),
                },
              ]}
            />
          </Card>
          <Card
            title="Book against actual"
            description={
              stocktake.status === "completed"
                ? "Each difference was settled with an adjustment on the item card"
                : "Book is the balance when the count was recorded; approval adjusts it to the actual quantity"
            }
          >
            <StocktakeLinesTable lines={lines} />
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <ApprovalCard
            chain={STOCKTAKE_CHAIN}
            approvals={stocktake.approvals}
            state={chain}
            action={decideStocktakeAction.bind(null, stocktake.uuid)}
            description="Management settles the differences"
            approveLabel="Approve and settle"
          />
        </div>
      </div>
    </>
  );
};
