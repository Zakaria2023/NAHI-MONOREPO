import { ExtractFormSection } from "@/components/finance/extract-form-section";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const NewExtractPage = () => (
  <>
    <PageHeader
      title="New extract"
      description="The executed quantities for a period. It then goes to the project engineer, the projects manager and finance in turn."
      back={{ href: "/finance/extracts", label: "Extracts" }}
    />
    <AsyncSection reloadKey="new-extract">
      <ExtractFormSection />
    </AsyncSection>
  </>
);

export default NewExtractPage;
