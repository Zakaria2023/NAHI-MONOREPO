import { FileText } from "lucide-react";
import Link from "next/link";
import { Supplier } from "services";
import { Card } from "ui";
import { FactList } from "@/components/shared/fact-list";

type SupplierCardProps = {
  supplier: Supplier;
};

/** The supplier's details as the invoice must carry them (finance §1 mandatory fields). */
export const SupplierCard = ({ supplier }: SupplierCardProps) => (
  <Card
    title={supplier.name}
    description="Supplier"
    action={
      <Link href={`/finance/payables/statement/${supplier.uuid}`} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover">
        <FileText size={14} />
        Statement
      </Link>
    }
  >
    <FactList
      columns={1}
      facts={[
        { label: "VAT number", value: <span dir="ltr">{supplier.vatNumber || "Missing"}</span> },
        { label: "CR number", value: <span dir="ltr">{supplier.crNumber || "Missing"}</span> },
        { label: "Address", value: supplier.address || "Missing" },
        { label: "E-mail (payment notices)", value: <span dir="ltr">{supplier.email}</span> },
        { label: "Phone", value: <span dir="ltr">{supplier.phone}</span> },
      ]}
    />
  </Card>
);
