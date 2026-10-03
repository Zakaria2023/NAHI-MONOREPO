import { FilePlus2 } from "lucide-react";
import { listProjects } from "services";
import { formatMoney } from "utils";
import { FormDialog } from "@/components/shared/form-dialog";
import { AsBuiltInvoiceForm } from "./as-built-invoice-form";

export const AsBuiltInvoiceSection = async () => {
  const projects = await listProjects({ operator: "stc" });
  return (
    <FormDialog
      label="Issue as-built invoice"
      title="Issue as-built tax invoice"
      description="STC is invoiced on the approved As-Built; it is refused until the Inspector and the Supervisor have approved it. VAT 15 % is added."
      variant="primary"
      icon={<FilePlus2 size={16} />}
    >
      <AsBuiltInvoiceForm
        projectOptions={projects.map((p) => ({ value: p.uuid, label: `${p.code} — ${p.name}`, hint: `${p.stageLabel} · PO ${formatMoney(p.poValue)}` }))}
      />
    </FormDialog>
  );
};
