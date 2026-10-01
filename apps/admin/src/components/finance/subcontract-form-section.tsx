import { listProjectOptions, listSubcontractors } from "services";
import { Card } from "ui";
import { SubcontractForm } from "./subcontract-form";

export const SubcontractFormSection = async () => {
  const [subcontractors, projectOptions] = await Promise.all([listSubcontractors(), listProjectOptions()]);
  return (
    <Card
      title="New subcontract"
      description="The value caps what extracts may certify; the retention % and the advance are deducted from every extract."
    >
      <SubcontractForm
        subcontractorOptions={subcontractors.map((s) => ({ value: s.uuid, label: s.name, hint: `VAT ${s.vatNumber}` }))}
        projectOptions={projectOptions}
      />
    </Card>
  );
};
