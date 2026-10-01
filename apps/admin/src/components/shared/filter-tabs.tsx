import Link from "next/link";

type FilterTabsProps = {
  tabs: { label: string; href: string; active: boolean }[];
};

export const FilterTabs = ({ tabs }: FilterTabsProps) => (
  <div className="flex w-fit gap-1 rounded-control border border-hairline bg-surface p-1">
    {tabs.map((tab) => (
      <Link
        key={tab.href}
        href={tab.href}
        className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${tab.active ? "bg-primary-tint font-medium text-primary" : "text-secondary hover:text-ink"}`}
      >
        {tab.label}
      </Link>
    ))}
  </div>
);
