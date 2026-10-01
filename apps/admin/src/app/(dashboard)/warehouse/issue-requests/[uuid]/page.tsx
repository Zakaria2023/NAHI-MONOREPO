import { AsyncSection } from "@/components/shared/async-section";
import { IssueRequestView } from "@/components/warehouse/issue-request-view";

type Props = {
  params: Promise<{ uuid: string }>;
};

const IssueRequestPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={uuid}>
      <IssueRequestView uuid={uuid} />
    </AsyncSection>
  );
};

export default IssueRequestPage;
