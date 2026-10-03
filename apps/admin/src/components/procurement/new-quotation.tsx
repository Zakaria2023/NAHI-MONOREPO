import Link from "next/link";
import { getPurchaseRequest, listSuppliers } from "services";
import { Card } from "ui";
import { addQuotationAction } from "@/app/(dashboard)/procurement/requests/[uuid]/quotations/new/actions";
import { PageHeader } from "@/components/shared/page-header";
import { BlockedNote } from "./blocked-note";
import { QuotationForm } from "./quotation-form";

type NewQuotationProps = {
  uuid: string;
};

/** Step 4: one supplier's offer on the request, priced line by line. */
export const NewQuotation = async ({ uuid }: NewQuotationProps) => {
  const [detail, suppliers] = await Promise.all([getPurchaseRequest(uuid), listSuppliers()]);
  const { pr, project } = detail;
  const quoted = new Set(detail.quotations.map((q) => q.supplierUuid));
  const open = suppliers.filter((s) => !quoted.has(s.uuid));
  return (
    <>
      <PageHeader
        title="Record a quotation"
        description={`${pr.number} · ${project.code} — ${project.name}. Quantities may be adjusted to what the supplier can deliver.`}
        back={{ href: `/procurement/requests/${pr.uuid}`, label: pr.number }}
      />
      {pr.status !== "rfq" ? (
        <BlockedNote>Quotations are recorded while the request is at RFQ — this one is past that step.</BlockedNote>
      ) : open.length === 0 ? (
        <BlockedNote>
          Every registered supplier has already quoted on this request.{" "}
          <Link href="/procurement/suppliers/new" className="text-primary hover:underline">
            Register another supplier
          </Link>{" "}
          to ask for a further offer.
        </BlockedNote>
      ) : (
        <Card title="Quotation" description="Request offers from at least three suppliers, or attach one previously approved quotation">
          <QuotationForm
            action={addQuotationAction.bind(null, pr.uuid)}
            supplierOptions={open.map((s) => ({ value: s.uuid, label: s.name, hint: `VAT ${s.vatNumber} · ${s.email}` }))}
            itemOptions={detail.lines.map((l) => ({ value: l.itemUuid, label: `${l.item.code} — ${l.item.name}`, hint: `Unit: ${l.item.unit}` }))}
            lines={pr.lines.map((l) => ({ itemUuid: l.itemUuid, qty: l.qty, unitPrice: l.estUnitPrice }))}
          />
        </Card>
      )}
    </>
  );
};
