import { getPurchaseRequest, listSuppliers } from "services";
import { Card, StatusPill } from "ui";
import { PURCHASE_REQUEST_STATUS_LABELS } from "@/db/label";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";
import { getCurrentStaff } from "@/lib/server/auth";
import { PR_TONES } from "@/lib/status-tones";
import { QuotationComparisonTable } from "./quotation-comparison-table";
import { RecordLog } from "./record-log";
import { RequestFacts } from "./request-facts";
import { RequestLinesCard } from "./request-lines-card";
import { RequestSide } from "./request-side";
import { RequestStageCard } from "./request-stage-card";

type PurchaseRequestViewProps = {
  uuid: string;
};

export const PurchaseRequestView = async ({ uuid }: PurchaseRequestViewProps) => {
  const [detail, actor, suppliers] = await Promise.all([getPurchaseRequest(uuid), getCurrentStaff(), listSuppliers()]);
  const { pr, project } = detail;
  return (
    <>
      <PageHeader
        title={pr.number}
        description={`${project.code} — ${project.name} · ${pr.department}`}
        back={{ href: "/procurement/requests", label: "Purchase requests" }}
        meta={<StatusPill tone={PR_TONES[pr.status]}>{PURCHASE_REQUEST_STATUS_LABELS[pr.status]}</StatusPill>}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <RequestStageCard detail={detail} actorRole={actor.role} suppliers={suppliers} />
          <RequestFacts detail={detail} />
          <RequestLinesCard detail={detail} />
          {pr.status !== "rfq" && detail.quotations.length > 0 && (
            <Card title="Quotations" description="The offers compared at step 5 — the best on each criterion is marked">
              <QuotationComparisonTable detail={detail} />
            </Card>
          )}
          <AsyncSection reloadKey={`log-${pr.uuid}`}>
            <RecordLog number={pr.number} uuid={pr.uuid} />
          </AsyncSection>
        </div>
        <RequestSide detail={detail} />
      </div>
    </>
  );
};
