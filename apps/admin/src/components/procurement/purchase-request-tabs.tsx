import { FilterTabs } from "@/components/shared/filter-tabs";

type PurchaseRequestTabsProps = {
  /** The `status` search param: waiting, rfq, ordered or closed. */
  group?: string;
};

export const PurchaseRequestTabs = ({ group }: PurchaseRequestTabsProps) => (
  <FilterTabs
    tabs={[
      { label: "All", href: "/procurement/requests", active: !group },
      { label: "Waiting approval", href: "/procurement/requests?status=waiting", active: group === "waiting" },
      { label: "RFQ", href: "/procurement/requests?status=rfq", active: group === "rfq" },
      { label: "Ordered", href: "/procurement/requests?status=ordered", active: group === "ordered" },
      { label: "Closed", href: "/procurement/requests?status=closed", active: group === "closed" },
    ]}
  />
);
