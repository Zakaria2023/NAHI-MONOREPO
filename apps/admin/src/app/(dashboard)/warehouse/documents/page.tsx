import { WarehouseDocRow } from "services";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentsTable } from "@/components/warehouse/documents-table";
import { NewDocumentLinks } from "@/components/warehouse/new-document-links";

type Props = {
  searchParams: Promise<{ kind?: string }>;
};

const KINDS: { kind: WarehouseDocRow["kind"]; label: string }[] = [
  { kind: "issue_request", label: "Issue requests" },
  { kind: "stock_transfer", label: "Transfers" },
  { kind: "stocktake", label: "Stocktakes" },
  { kind: "write_off", label: "Write-offs" },
];

const WarehouseDocumentsPage = async ({ searchParams }: Props) => {
  const { kind: raw } = await searchParams;
  const kind = KINDS.find((k) => k.kind === raw)?.kind;
  return (
    <>
      <PageHeader
        title="Warehouse documents"
        description="Issue requests, transfers between warehouses, stocktakes and write-offs, and whose approval each one waits for."
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { label: "All", href: "/warehouse/documents", active: !kind },
            ...KINDS.map((k) => ({ label: k.label, href: `/warehouse/documents?kind=${k.kind}`, active: kind === k.kind })),
          ]}
        />
        <NewDocumentLinks />
      </div>
      <AsyncSection reloadKey={`documents-${kind ?? ""}`}>
        <DocumentsTable kind={kind} />
      </AsyncSection>
    </>
  );
};

export default WarehouseDocumentsPage;
