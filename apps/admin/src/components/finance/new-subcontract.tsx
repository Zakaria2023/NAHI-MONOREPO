import { listProjectOptions, listSubcontractors } from "services";
import { Card } from "ui";
import { SubcontractForm } from "./subcontract-form";

export const NewSubcontract = async () => {
  const [subcontractors, projectOptions] = await Promise.all([listSubcontractors(), listProjectOptions()]);
  return (
    <Card
      title="Subcontract"
      description="The value caps what extracts may certify; the retention % and the advance are deducted from every extract."
    >
      <SubcontractForm
        subcontractorOptions={subcontractors.map((s) => ({ value: s.uuid, label: s.name, hint: `VAT ${s.vatNumber}` }))}
        projectOptions={projectOptions}
      />
    </Card>
  );
};
