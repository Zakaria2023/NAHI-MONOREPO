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
  tagline?: string;
  brandIcon: ReactNode;
  groups: NavGroup[];
};

/** The dark rail every dashboard screen sits beside. One link is lit: the deepest that covers the path. */
export const DashboardSidebar = ({ brand, tagline, brandIcon, groups }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const current = useMemo(
    () => activeNavHref(pathname, groups.flatMap((g) => g.links.map((l) => l.href))),
    [pathname, groups],
  );

  return (
    <aside className="fixed inset-y-0 start-0 z-40 flex w-64 flex-col border-e border-sidebar-border bg-sidebar">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-white">{brandIcon}</div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-sidebar-ink">{brand}</span>
          {tagline && <span className="text-xs text-sidebar-text">{tagline}</span>}
        </div>
      </div>
      <nav className="scrollbar-dark flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col gap-0.5">
            <span className="mb-1.5 px-3 text-xs font-medium tracking-wider text-sidebar-text/70 uppercase">{group.title}</span>
            {group.links.map((link) => {
              const active = link.href === current;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex h-9 items-center gap-3 rounded-control px-3 text-sm transition-colors ${
                    active
                      ? "bg-sidebar-raised font-medium text-sidebar-ink"
                      : "text-sidebar-text hover:bg-sidebar-raised hover:text-sidebar-ink"
                  }`}
                >
                  {active && <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-primary" />}
                  <span className={`flex shrink-0 items-center ${active ? "text-primary-tint-border" : ""}`}>{link.icon}</span>
                  <span className="flex-1">{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-white">
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
