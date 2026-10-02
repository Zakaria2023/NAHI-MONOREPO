import Link from "next/link";
import { PurchaseOrderDetail } from "services";
import { Card, Table } from "ui";
import { formatDate, formatMoney, formatNumber } from "utils";
import { BUDGET_CATEGORY_LABELS } from "@/db/label";
import { FactList } from "@/components/shared/fact-list";
import { PartyBlock } from "./party-block";

type PurchaseOrderDocumentProps = {
  detail: PurchaseOrderDetail;
};

/** Step 7: the PO as the supplier receives it — both parties, the lines, VAT and the terms. */
export const PurchaseOrderDocument = ({ detail }: PurchaseOrderDocumentProps) => {
  const { po, company, supplier, project, pr, quotation } = detail;
  return (
    <Card>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline-soft pb-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs tracking-wide text-muted uppercase">Purchase order</span>
            <span dir="ltr" className="w-fit text-2xl text-ink">
              {po.number}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-sm">
            <span className="text-muted">Issued {formatDate(po.createdAt)}</span>
            {po.sentAt && <span className="text-muted">Sent {formatDate(po.sentAt)}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PartyBlock heading="From" party={company} />
          <PartyBlock heading="To — supplier" party={supplier} />
        </div>

        <FactList
          columns={4}
          facts={[
            {
              label: "Project",
              value: (
                <Link href={`/projects/${project.uuid}`} className="hover:text-primary">
                  <span dir="ltr">{project.code}</span>
                </Link>
              ),
            },
            {
              label: "Purchase request",
              value: (
                <Link href={`/procurement/requests/${pr.uuid}`} dir="ltr" className="hover:text-primary">
                  {pr.number}
                </Link>
              ),
            },
            detail.contract
              ? {
                  label: "Annual contract",
                  value: (
                    <Link href={`/procurement/contracts/${detail.contract.uuid}`} dir="ltr" className="hover:text-primary">
                      {detail.contract.number}
                    </Link>
                  ),
                }
              : { label: "Quotation", value: <span dir="ltr">{quotation?.number ?? "—"}</span> },
            { label: "Budget category", value: BUDGET_CATEGORY_LABELS[po.budgetCategory] },
          ]}
        />

        <Table
          data={detail.lines}
          rowKey={(l) => l.itemUuid}
          columns={[
            { key: "code", header: "Code", render: (l) => <span dir="ltr">{l.item.code}</span> },
            { key: "item", header: "Item", render: (l) => l.item.name },
            { key: "unit", header: "Unit", render: (l) => l.item.unit },
            { key: "qty", header: "Qty", align: "end", render: (l) => formatNumber(l.qty) },
            { key: "price", header: "Unit price", align: "end", render: (l) => <span className="whitespace-nowrap">{formatMoney(l.unitPrice)}</span> },
            { key: "total", header: "Line total", align: "end", render: (l) => <span className="whitespace-nowrap">{formatMoney(l.lineTotal)}</span> },
          ]}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <dt className="text-muted">Delivery period</dt>
            <dd className="text-ink">{po.deliveryDays} days</dd>
            <dt className="text-muted">Payment terms</dt>
            <dd className="text-ink">{po.paymentTermsDays} days</dd>
            <dt className="text-muted">Expected delivery</dt>
            <dd className="text-ink">{po.expectedDeliveryAt ? formatDate(po.expectedDeliveryAt) : "Set when sent"}</dd>
          </dl>
          <dl className="grid min-w-64 grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <dt className="text-muted">Subtotal</dt>
            <dd className="text-end text-ink">{formatMoney(po.subtotal)}</dd>
            <dt className="text-muted">VAT 15%</dt>
            <dd className="text-end text-ink">{formatMoney(po.vat)}</dd>
            <dt className="border-t border-hairline pt-1.5 font-medium text-ink">Total</dt>
            <dd className="border-t border-hairline pt-1.5 text-end text-base font-medium text-ink">{formatMoney(po.total)}</dd>
          </dl>
        </div>
      </div>
    </Card>
  );
};
