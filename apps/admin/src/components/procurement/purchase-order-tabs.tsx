import { FilterTabs } from "@/components/shared/filter-tabs";

type PurchaseOrderTabsProps = {
  /** The `status` search param: approval, open, late or closed. */
  group?: string;
};

export const PurchaseOrderTabs = ({ group }: PurchaseOrderTabsProps) => (
  <FilterTabs
    tabs={[
      { label: "All", href: "/procurement/orders", active: !group },
      { label: "Waiting approval", href: "/procurement/orders?status=approval", active: group === "approval" },
      { label: "Open", href: "/procurement/orders?status=open", active: group === "open" },
      { label: "Late", href: "/procurement/orders?status=late", active: group === "late" },
      { label: "Closed", href: "/procurement/orders?status=closed", active: group === "closed" },
    ]}
  />
);
