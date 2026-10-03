import Link from "next/link";
import { getIssueRequest, ISSUE_CHAIN, issueStockBlocker, listSubcontractors } from "services";
import { Card, StatusPill } from "ui";
import { formatDate } from "utils";
import { INVENTORY_FREQUENCY_LABELS, ISSUE_REQUEST_STATUS_LABELS, RECIPIENT_KIND_LABELS } from "@/db/label";
import { decideIssueRequestAction, issueStockAction } from "@/app/(dashboard)/warehouse/issue-requests/[uuid]/actions";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentStaff } from "@/lib/server/auth";
import { ISSUE_TONES } from "@/lib/status-tones";
import { ApprovalCard } from "./approval-card";
import { BlockedNote } from "./blocked-note";
import { IssueSignatures } from "./issue-signatures";
import { IssueStockForm } from "./issue-stock-form";
import { FormDialog } from "@/components/shared/form-dialog";
import { StockLinesTable } from "./stock-lines-table";

type IssueRequestViewProps = {
  uuid: string;
};

export const IssueRequestView = async ({ uuid }: IssueRequestViewProps) => {
  const [detail, subcontractors, actor] = await Promise.all([getIssueRequest(uuid), listSubcontractors(), getCurrentStaff()]);
  const { request, project, warehouse, lines, chain } = detail;
  const subcontractor = subcontractors.find((s) => s.uuid === request.recipient.subcontractorUuid);
  const hasAssets = lines.some((l) => l.item.kind === "fixed_asset");
  const blocker = issueStockBlocker(actor, detail);
  return (
    <>
      <PageHeader
        title={request.number}
        description={`Issue from ${warehouse.code} to ${request.recipient.name}, charged to ${project.code}.`}
        back={{ href: "/warehouse/documents?kind=issue_request", label: "Warehouse documents" }}
        meta={<StatusPill tone={ISSUE_TONES[request.status]}>{ISSUE_REQUEST_STATUS_LABELS[request.status]}</StatusPill>}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card title="Issue note" description="Who receives the stock and what it is charged to">
            <FactList
              columns={3}
              facts={[
                {
                  label: "Project",
                  value: (
                    <Link href={`/projects/${project.uuid}`} className="hover:text-primary">
                      <span dir="ltr">{project.code}</span> — {project.name}
                    </Link>
                  ),
                },
                { label: "Warehouse", value: `${warehouse.code} — ${warehouse.name}` },
                { label: "Requested by", value: request.requestedBy },
                { label: "Recipient", value: `${request.recipient.name} (${RECIPIENT_KIND_LABELS[request.recipient.kind]})` },
                { label: "Subcontractor", value: subcontractor?.name ?? "—" },
                {
                  label: "Custody count",
                  value: request.inventoryFrequency ? INVENTORY_FREQUENCY_LABELS[request.inventoryFrequency] : hasAssets ? "Not set" : "No fixed assets",
                },
                { label: "Issued", value: request.issuedAt ? formatDate(request.issuedAt) : "Not yet" },
              ]}
            />
          </Card>
          <Card
            title="Lines"
            description={hasAssets ? "Fixed assets become custody on the recipient until they are returned" : "Consumables, deducted from stock on issue"}
          >
            <div className="flex flex-col gap-3">
              <StockLinesTable lines={lines} availableLabel={`In ${warehouse.code} now`} showAvailable={request.status !== "issued"} />
              <p className="text-end text-xs text-muted">
                {lines.length} line(s) · charged to {request.recipient.name}
              </p>
            </div>
          </Card>
          {request.status === "issued" ? (
            <Card title="Signatures" description="The issue note as signed when the stock left the warehouse">
              <IssueSignatures request={request} />
            </Card>
          ) : (
            request.status !== "rejected" && (
              <Card title="Issue stock" description="The recipient signs the issue note, the stock is deducted and charged to them">
                {blocker ? (
                  <BlockedNote reason={blocker} />
                ) : (
                  <FormDialog label="Issue stock" title="Issue stock" description={`${request.recipient.name} signs the issue note`} variant="success">
                    <IssueStockForm action={issueStockAction.bind(null, request.uuid)} recipientName={request.recipient.name} />
                  </FormDialog>
                )}
              </Card>
            )
          )}
        </div>
        <div className="flex flex-col gap-6">
          <ApprovalCard
            chain={ISSUE_CHAIN}
            approvals={request.approvals}
            state={chain}
            action={decideIssueRequestAction.bind(null, request.uuid)}
            description="The region project manager approves the issue"
            approveLabel="Approve issue"
          />
        </div>
      </div>
    </>
  );
};
