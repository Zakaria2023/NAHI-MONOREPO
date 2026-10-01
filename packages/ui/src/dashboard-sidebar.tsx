"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";
import { activeNavHref } from "utils";

export type NavLink = {
  /** A rendered element, not a component: a server layout hands this list to a client component. */
  icon: ReactNode;
  label: string;
  href: string;
  badge?: number;
};

export type NavGroup = {
  title: string;
  links: NavLink[];
};

type DashboardSidebarProps = {
  brand: string;
  brandIcon: ReactNode;
  groups: NavGroup[];
};

export const DashboardSidebar = ({ brand, brandIcon, groups }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const current = useMemo(
    () => activeNavHref(pathname, groups.flatMap((g) => g.links.map((l) => l.href))),
    [pathname, groups],
  );

  return (
    <aside className="fixed inset-y-0 start-0 z-40 flex w-64 flex-col border-e border-hairline bg-surface">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-hairline-soft px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-white">{brandIcon}</div>
        <span className="text-lg text-ink">{brand}</span>
      </div>
      <nav className="scrollbar-slim flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col gap-0.5">
            <span className="mb-1 px-3 text-xs font-medium tracking-wider text-faint uppercase">{group.title}</span>
            {group.links.map((link) => {
              const active = link.href === current;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex h-9 items-center gap-3 rounded-control px-3 text-sm transition-colors ${active ? "bg-primary font-medium text-white" : "text-secondary hover:bg-hover hover:text-ink"}`}
                >
                  <span className="flex shrink-0 items-center">{link.icon}</span>
                  <span className="flex-1">{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span
                      className={`rounded-full px-2 text-xs ${active ? "bg-white text-primary" : "bg-primary-tint text-primary"}`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};
