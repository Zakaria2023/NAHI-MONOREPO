import { subcontractorStatement } from "services";
import { Card, StatTile } from "ui";
import { formatMoney, round2 } from "utils";
import { FactList } from "@/components/shared/fact-list";
import { PageHeader } from "@/components/shared/page-header";
import { ExtractsTable } from "./extracts-table";
import { SectionHeading } from "./section-heading";
import { SubcontractsTable } from "./subcontracts-table";

type SubcontractorStatementProps = {
  subcontractorUuid: string;
};

/** Finance §2 reports: the subcontractor statement, retention held, materials issued and deducted. */
export const SubcontractorStatement = async ({ subcontractorUuid }: SubcontractorStatementProps) => {
  const { subcontractor, subcontracts, extracts, totals } = await subcontractorStatement(subcontractorUuid);
  return (
    <>
      <PageHeader
        title={`${subcontractor.name} — statement`}
        description="Totals count approved and paid extracts only; extracts still in review are listed below them."
        back={{ href: "/finance/subcontracts", label: "Subcontractors" }}
      />
      <Card>
        <FactList
          columns={4}
          facts={[
            { label: "VAT number", value: <span dir="ltr">{subcontractor.vatNumber}</span> },
            { label: "CR number", value: <span dir="ltr">{subcontractor.crNumber}</span> },
            { label: "E-mail", value: <span dir="ltr">{subcontractor.email}</span> },
            { label: "Phone", value: <span dir="ltr">{subcontractor.phone}</span> },
          ]}
        />
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Gross certified" value={formatMoney(totals.gross)} />
        <StatTile label="Retention held" value={formatMoney(totals.retention)} />
        <StatTile label="Materials deducted" value={formatMoney(totals.materials)} />
        <StatTile label="Net due" value={formatMoney(totals.net)} />
        <StatTile label="Paid" value={formatMoney(totals.paid)} />
        <StatTile label="Still to pay" value={formatMoney(round2(totals.net - totals.paid))} />
      </div>
      <section className="flex flex-col gap-3">
        <SectionHeading title="Subcontracts" />
        <SubcontractsTable subcontracts={subcontracts} linkSubcontractor={false} emptyMessage="No subcontract with this subcontractor yet." />
      </section>
      <section className="flex flex-col gap-3">
        <SectionHeading title="Extracts" />
        <ExtractsTable extracts={extracts} emptyMessage="No extract submitted by this subcontractor yet." />
      </section>
    </>
  );
};
