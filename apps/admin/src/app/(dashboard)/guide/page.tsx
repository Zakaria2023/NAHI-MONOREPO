import { GuideBody } from "@/components/guide/guide-body";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const GuidePage = () => (
  <>
    <PageHeader
      title="Project guide"
      description="Every page of the MVP: what it does, the files that build it, the business functions it calls, and the section of the specifications it implements. Every page name is a link."
    />
    <AsyncSection reloadKey="guide">
      <GuideBody />
    </AsyncSection>
  </>
);

export default GuidePage;
