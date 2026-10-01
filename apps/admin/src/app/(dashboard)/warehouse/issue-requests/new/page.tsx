import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";
import { NewIssueRequest } from "@/components/warehouse/new-issue-request";

const NewIssueRequestPage = () => (
  <>
    <PageHeader
      title="New issue request"
      description="The project manager asks the warehouse for stock; the region project manager approves; the storekeeper issues it against the recipient's signature."
      back={{ href: "/warehouse/documents?kind=issue_request", label: "Warehouse documents" }}
    />
    <AsyncSection reloadKey="new-issue-request">
      <NewIssueRequest />
    </AsyncSection>
  </>
);

export default NewIssueRequestPage;
