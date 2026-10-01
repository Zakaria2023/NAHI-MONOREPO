import { CustomerAgeing } from "@/components/finance/customer-ageing";
import { DueSchedule } from "@/components/finance/due-schedule";
import { SectionHeading } from "@/components/finance/section-heading";
import { SupplierAgeing } from "@/components/finance/supplier-ageing";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";

const SchedulePage = () => (
  <>
    <PageHeader
      title="Due schedule & ageing"
      description="What falls due to suppliers week by week, and how old the open supplier and customer balances are."
    />
    <section className="flex flex-col gap-3">
      <SectionHeading title="Weekly due schedule" description="Approved invoices not yet paid, grouped by the week (Monday) they fall due." />
      <AsyncSection reloadKey="due-schedule">
        <DueSchedule />
      </AsyncSection>
    </section>
    <section className="flex flex-col gap-3">
      <SectionHeading title="Supplier ageing" description="Outstanding net payable by days past the due date. Open a supplier for the statement." />
      <AsyncSection reloadKey="supplier-ageing">
        <SupplierAgeing />
      </AsyncSection>
    </section>
    <section className="flex flex-col gap-3">
      <SectionHeading title="Customer ageing" description="Uncollected customer invoices, VAT included, by days past the due date." />
      <AsyncSection reloadKey="customer-ageing">
        <CustomerAgeing />
      </AsyncSection>
    </section>
  </>
);

export default SchedulePage;
