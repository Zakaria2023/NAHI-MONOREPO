import { NewQuotation } from "@/components/procurement/new-quotation";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ uuid: string }>;
};

const NewQuotationPage = async ({ params }: Props) => {
  const { uuid } = await params;
  return (
    <AsyncSection reloadKey={`new-quotation-${uuid}`}>
      <NewQuotation uuid={uuid} />
    </AsyncSection>
  );
};

export default NewQuotationPage;
