import Link from "next/link";

type FilterTabsProps = {
  tabs: { label: string; href: string; active: boolean }[];
};

export const FilterTabs = ({ tabs }: FilterTabsProps) => (
  <div className="flex w-fit flex-wrap gap-1.5">
    {tabs.map((tab) => (
      <Link
        key={tab.href}
        href={tab.href}
        className={`rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors ${
          tab.active ? "border-primary bg-primary font-medium text-white" : "border-hairline text-secondary hover:border-search-border hover:text-ink"
        }`}
      >
        {tab.label}
      </Link>
    ))}
  </div>
);
