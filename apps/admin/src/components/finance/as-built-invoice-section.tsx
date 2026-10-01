import { listProjects } from "services";
import { Card } from "ui";
import { formatMoney } from "utils";
import { AsBuiltInvoiceForm } from "./as-built-invoice-form";

export const AsBuiltInvoiceSection = async () => {
  const projects = await listProjects({ operator: "stc" });
  return (
    <Card
      title="Issue as-built tax invoice"
      description="STC is invoiced on the approved As-Built; it is refused until the Inspector and the Supervisor have approved it. VAT 15 % is added."
    >
      <AsBuiltInvoiceForm
        projectOptions={projects.map((p) => ({ value: p.uuid, label: `${p.code} — ${p.name}`, hint: `${p.stageLabel} · PO ${formatMoney(p.poValue)}` }))}
      />
    </Card>
  );
};
