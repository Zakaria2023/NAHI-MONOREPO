import { ApprovalsBoard } from "@/components/approvals/approvals-board";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const ApprovalsPage = () => (
  <>
    <PageHeader
      title="My approvals"
      description="Every request whose next step belongs to your role — approval chains, procurement reviews, stock to issue, POs to send, invoices to approve."
    />
    <AsyncSection reloadKey="approvals">
      <ApprovalsBoard />
    </AsyncSection>
  </>
);

export default ApprovalsPage;
