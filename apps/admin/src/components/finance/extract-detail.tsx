import Link from "next/link";
import { EXTRACT_CHAIN, getExtract } from "services";
import { Card, StatusPill } from "ui";
import { formatDate, formatDateTime, formatMoney } from "utils";
import { EXTRACT_STATUS_LABELS, STAFF_ROLE_LABELS } from "@/db/label";
import { decideExtractAction, markExtractPaidAction } from "@/app/(dashboard)/finance/extracts/[uuid]/actions";
import { ActionButton } from "@/components/shared/action-button";
import { ChainTimeline } from "@/components/shared/chain-timeline";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentStaff } from "@/lib/server/auth";
import { EXTRACT_TONES } from "@/lib/status-tones";
import { BlockedNote } from "./blocked-note";
import { DeductionsWaterfall } from "./deductions-waterfall";
import { DoneNote } from "./done-note";
import { ExtractDecisionForm } from "./extract-decision-form";
import { ExtractLinesTable } from "./extract-lines-table";

type ExtractDetailProps = {
  uuid: string;
};

const PENDING = ["submitted", "engineer_approved", "pm_approved"];

export const ExtractDetail = async ({ uuid }: ExtractDetailProps) => {
  const [{ extract, subcontract, chain, preview }, actor] = await Promise.all([getExtract(uuid), getCurrentStaff()]);
  const pending = PENDING.includes(extract.status);
  const nextRole = chain.nextRole;
  return (
    <>
      <PageHeader
        title={extract.number}
        description={`${extract.subcontractorName} — ${subcontract.scope}`}
        back={{ href: "/finance/extracts", label: "Extracts" }}
        meta={
          <>
            <StatusPill tone={EXTRACT_TONES[extract.status]}>{EXTRACT_STATUS_LABELS[extract.status]}</StatusPill>
            <StatusPill tone={extract.submittedVia === "portal" ? "info" : "neutral"}>
              {extract.submittedVia === "portal" ? "Submitted on the portal" : "Entered in the admin"}
            </StatusPill>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <FactList
              columns={4}
              facts={[
                {
                  label: "Subcontractor",
                  value: (
                    <Link href={`/finance/subcontracts/statement/${subcontract.subcontractorUuid}`} className="hover:text-primary">
                      {extract.subcontractorName}
                    </Link>
                  ),
                },
                { label: "Subcontract", value: <span dir="ltr">{extract.subcontractNumber}</span> },
                {
                  label: "Project",
                  value: (
                    <Link href={`/projects/${subcontract.projectUuid}`} dir="ltr" className="hover:text-primary">
                      {extract.projectCode}
                    </Link>
                  ),
                },
                { label: "Period", value: `${formatDate(extract.periodFrom)} – ${formatDate(extract.periodTo)}` },
                { label: "Contract value", value: formatMoney(subcontract.value) },
                { label: "Certified so far", value: formatMoney(subcontract.certified) },
                { label: "Submitted by", value: extract.submittedBy },
                { label: "Submitted", value: formatDateTime(extract.createdAt) },
              ]}
            />
          </Card>
          <Card title="Executed quantities" description="As submitted by the subcontractor for the period.">
            <ExtractLinesTable lines={extract.lines} />
          </Card>
          <DeductionsWaterfall figures={preview} retentionPct={subcontract.retentionPct} penaltyNote={extract.penaltyNote} pending={pending} />
        </div>
        <div className="flex flex-col gap-6">
          <Card title="Approval" description="Project engineer, then projects manager, then finance. Any approver may set penalties.">
            <div className="flex flex-col gap-5">
              <ChainTimeline chain={EXTRACT_CHAIN} approvals={extract.approvals} />
              {pending && nextRole && (
                <ExtractDecisionForm
                  key={nextRole}
                  action={decideExtractAction.bind(null, extract.uuid)}
                  awaitingLabel={STAFF_ROLE_LABELS[nextRole]}
                  canDecide={actor.role === nextRole}
                  penalties={extract.penalties}
                  penaltyNote={extract.penaltyNote}
                />
              )}
            </div>
          </Card>
          <Card title="Payment" description="The net due is posted for payment once finance approves.">
            {extract.status === "approved" && <ActionButton action={markExtractPaidAction.bind(null, extract.uuid)} label={`Mark ${formatMoney(extract.net)} paid`} variant="success" />}
            {extract.status === "paid" && <DoneNote label={`Paid ${formatMoney(extract.net)}`} at={extract.paidAt} />}
            {extract.status === "rejected" && <BlockedNote reason="The extract was rejected; the subcontractor submits a new one." />}
            {pending && nextRole && <BlockedNote reason={`Not payable yet — waiting for ${STAFF_ROLE_LABELS[nextRole]}.`} />}
          </Card>
        </div>
      </div>
    </>
  );
};
