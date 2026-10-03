import { Plus, Send } from "lucide-react";
import Link from "next/link";
import { PurchaseRequestDetail, Supplier } from "services";
import { formatMoney } from "utils";
import { submitQuotationAction } from "@/app/(dashboard)/procurement/requests/[uuid]/actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { BlockedNote } from "./blocked-note";
import { QuotationComparisonTable } from "./quotation-comparison-table";
import { SelectQuotationForm } from "./select-quotation-form";

type QuotationsPanelProps = {
  detail: PurchaseRequestDetail;
  suppliers: Supplier[];
};

/** Steps 4–5: collect the offers, compare them, and send the winner to the approvers. */
export const QuotationsPanel = ({ detail, suppliers }: QuotationsPanelProps) => {
  const { pr, quotations, comparison } = detail;
  const quoted = new Set(quotations.map((q) => q.supplierUuid));
  const open = suppliers.filter((s) => !quoted.has(s.uuid));
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        Request offers by e-mail from at least three suppliers, or attach one previously approved quotation. Quantities may be
        adjusted to what the supplier can deliver.
      </p>
      <QuotationComparisonTable detail={detail} />

      <section className="flex flex-col gap-3 border-t border-hairline-soft pt-4">
        <h3 className="text-sm font-medium text-ink">Record a quotation</h3>
        {open.length === 0 ? (
          <BlockedNote>
            Every registered supplier has already quoted on this request.{" "}
            <Link href="/procurement/suppliers/new" className="text-primary hover:underline">
              Register another supplier
            </Link>{" "}
            to ask for a further offer.
          </BlockedNote>
        ) : (
          <Link
            href={`/procurement/requests/${pr.uuid}/quotations/new`}
            className="flex h-9 w-fit items-center gap-2 rounded-full border border-hairline px-4 text-sm font-medium text-ink hover:bg-hover"
          >
            <Plus size={16} />
            Record a quotation
          </Link>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-hairline-soft pt-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium text-ink">Submit for approval</h3>
          <p className="text-xs text-muted">
            The chosen offer goes to the region PM, procurement, the projects manager, the CFO, the COO and the deputy GM.
          </p>
        </div>
        <FormDialog
          label="Submit for approval"
          title="Submit for approval"
          description="The winning offer goes to the six approvers"
          variant="primary"
          icon={<Send size={16} />}
          blocker={detail.rfqBlocker}
        >
          <SelectQuotationForm
            action={submitQuotationAction.bind(null, pr.uuid)}
            defaultUuid={comparison[0]?.quotationUuid ?? ""}
            options={comparison.map((c) => ({
              value: c.quotationUuid,
              label: `${c.supplierName} — ${formatMoney(c.total)}`,
              hint: `${c.deliveryDays} days delivery · ${c.paymentTermsDays} days terms · quality ${c.qualityScore} / 5`,
            }))}
          />
        </FormDialog>
      </section>
    </div>
  );
};
