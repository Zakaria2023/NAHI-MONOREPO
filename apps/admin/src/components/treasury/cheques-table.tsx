import Link from "next/link";
import { ChequeRow } from "services";
import { StatusPill, Table } from "ui";
import { formatDate, formatMoney } from "utils";
import { CHEQUE_DIRECTION_LABELS, CHEQUE_STATUS_LABELS } from "@/db/label";
import { bounceChequeAction, clearChequeAction } from "@/app/(dashboard)/finance/cheques/actions";
import { ActionButton } from "@/components/shared/action-button";
import { BounceForm } from "./bounce-form";

type ChequesTableProps = {
  cheques: ChequeRow[];
};

const TONES = {
  pending: "warning",
  cleared: "success",
  bounced: "danger",
} as const;

export const ChequesTable = ({ cheques }: ChequesTableProps) => (
  <Table
    data={cheques}
    rowKey={(c) => c.uuid}
    emptyMessage="No cheques here."
    columns={[
      {
        key: "number",
        header: "Cheque",
        render: (c) => (
          <div className="flex flex-col gap-0.5">
            <span dir="ltr" className="font-medium">
              {c.number}
            </span>
            <span className="text-xs text-muted">
              {CHEQUE_DIRECTION_LABELS[c.direction]} · {c.bankAccountCode}
            </span>
          </div>
        ),
      },
      { key: "party", header: "Party", render: (c) => c.party },
      {
        key: "for",
        header: "For",
        render: (c) => (
          <Link
            href={c.ref.kind === "supplier_invoice" ? `/finance/payables/${c.ref.uuid}` : "/finance/receivables"}
            dir="ltr"
            className="hover:text-primary"
          >
            {c.ref.label}
          </Link>
        ),
      },
      { key: "amount", header: "Amount", align: "end", render: (c) => <span className="font-medium">{formatMoney(c.amount)}</span> },
      { key: "written", header: "Written", render: (c) => formatDate(c.issuedAt) },
      {
        key: "due",
        header: "Due",
        render: (c) => (
          <span className="flex items-center gap-2">
            {formatDate(c.dueDate)}
            {c.postdated && <StatusPill tone="info">Post-dated</StatusPill>}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        wrap: true,
        render: (c) =>
          c.status === "pending" ? (
            <div className="relative z-10 flex flex-col gap-2">
              {!c.postdated && <ActionButton action={clearChequeAction.bind(null, c.uuid)} label="Cleared" size="sm" variant="success" />}
              <BounceForm action={bounceChequeAction.bind(null, c.uuid)} />
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <StatusPill tone={TONES[c.status]}>{CHEQUE_STATUS_LABELS[c.status]}</StatusPill>
              <span className="text-xs text-muted">
                {c.status === "cleared" ? formatDate(c.clearedAt) : `${formatDate(c.bouncedAt)} — ${c.bounceReason ?? ""}`}
              </span>
            </div>
          ),
      },
    ]}
  />
);
