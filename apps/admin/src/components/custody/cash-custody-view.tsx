import { CASH_CUSTODY_CHAIN, custodyFinanceBlocker, getCashCustody } from "services";
import { Card, StatusPill } from "ui";
import { formatDateTime, formatMoney } from "utils";
import { CASH_CUSTODY_STATUS_LABELS } from "@/db/label";
import { decideCashCustodyAction, disburseCashCustodyAction, settleCashCustodyAction } from "@/app/(dashboard)/custody/[uuid]/actions";
import { ActionButton } from "@/components/shared/action-button";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { ApprovalCard } from "@/components/warehouse/approval-card";
import { BlockedNote } from "@/components/warehouse/blocked-note";
import { getCurrentStaff } from "@/lib/server/auth";
import { CASH_CUSTODY_TONES } from "@/lib/status-tones";
import { CustodyReceipt } from "./custody-receipt";
import { SettleForm } from "./settle-form";

type CashCustodyViewProps = {
  uuid: string;
};

export const CashCustodyView = async ({ uuid }: CashCustodyViewProps) => {
  const [detail, actor] = await Promise.all([getCashCustody(uuid), getCurrentStaff()]);
  const { custody, chain } = detail;
  const financeBlocker = custodyFinanceBlocker(actor);
  return (
    <>
      <PageHeader
        title={custody.number}
        description={`${formatMoney(custody.amount)} in ${custody.employeeName}'s name for ${detail.project.code}.`}
        back={{ href: "/custody", label: "Cash custody" }}
        meta={<StatusPill tone={CASH_CUSTODY_TONES[custody.status]}>{CASH_CUSTODY_STATUS_LABELS[custody.status]}</StatusPill>}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <CustodyReceipt detail={detail} />
          {custody.status === "pending_approval" && (
            <Card title="Disbursement" description="Paid out against the employee's signature on the receipt">
              <BlockedNote reason="Custody is disbursed once all six approvals are in" />
            </Card>
          )}
          {custody.status === "approved" && (
            <Card title="Disbursement" description="Pay the employee and have them sign the receipt form — it enters their custody ledger">
              <ActionButton action={disburseCashCustodyAction.bind(null, custody.uuid)} label="Disburse — receipt signed" variant="success" blocker={financeBlocker} />
            </Card>
          )}
          {custody.status === "disbursed" && (
            <Card title="Settlement" description="What was spent against receipts; the rest comes back to the cash box">
              {financeBlocker ? (
                <BlockedNote reason={financeBlocker} />
              ) : (
                <SettleForm action={settleCashCustodyAction.bind(null, custody.uuid)} amount={custody.amount} />
              )}
            </Card>
          )}
          {custody.settlement && (
            <Card title="Settlement" description="Settled — a new custody on this project is now allowed">
              <FactList
                columns={4}
                facts={[
                  { label: "Spent", value: formatMoney(custody.settlement.spent) },
                  { label: "Returned", value: formatMoney(custody.settlement.returned) },
                  { label: "Settled", value: formatDateTime(custody.settlement.settledAt) },
                  { label: "By", value: custody.settlement.by },
                  ...(custody.settlement.note ? [{ label: "Note", value: custody.settlement.note }] : []),
                ]}
              />
            </Card>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <ApprovalCard
            chain={CASH_CUSTODY_CHAIN}
            approvals={custody.approvals}
            state={chain}
            action={decideCashCustodyAction.bind(null, custody.uuid)}
            description="Region accountant, region PM, projects manager, CFO, COO and deputy GM"
            approveLabel="Approve custody"
          />
        </div>
      </div>
    </>
  );
};
