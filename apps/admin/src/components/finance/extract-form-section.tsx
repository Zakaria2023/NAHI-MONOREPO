import { listSubcontracts } from "services";
import { Card, EmptyState } from "ui";
import { formatMoney } from "utils";
import { ExtractForm } from "./extract-form";

export const ExtractFormSection = async () => {
  const subcontracts = await listSubcontracts();
  if (subcontracts.length === 0) {
    return <EmptyState title="No subcontract yet">Create a subcontract under Subcontractors first; an extract is always taken against one.</EmptyState>;
  }
  return (
    <Card
      title="Extract"
      description="Entered by staff on the subcontractor's behalf. It is refused if the extracts would exceed the subcontract value."
    >
      <ExtractForm
        subcontractOptions={subcontracts.map((s) => ({
          value: s.uuid,
          label: `${s.number} — ${s.subcontractorName}`,
          hint: `${s.projectCode} · ${formatMoney(s.certified)} certified of ${formatMoney(s.value)}`,
        }))}
      />
    </Card>
  );
};
