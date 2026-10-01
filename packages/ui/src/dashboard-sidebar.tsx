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
  /** Pinned under the menu — the signed-in user. */
  footer?: ReactNode;
};

/** The rail on the grey frame beside the work panel. One link is lit: the deepest that covers the path. */
export const DashboardSidebar = ({ brand, tagline, brandIcon, groups, footer }: DashboardSidebarProps) => {
  const pathname = usePathname();
  const current = useMemo(
    () => activeNavHref(pathname, groups.flatMap((g) => g.links.map((l) => l.href))),
    [pathname, groups],
  );

  return (
    <aside className="fixed inset-y-0 start-0 z-40 flex w-64 flex-col bg-sidebar">
      <Link href="/" className="mx-3 mt-3 flex items-center gap-3 rounded-card px-2 py-2 transition-colors hover:bg-sidebar-hover">
        <div className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-white">{brandIcon}</div>
        <div className="flex flex-col">
          <span className="text-base font-medium tracking-tight text-ink">{brand}</span>
          {tagline && <span className="text-xs text-muted">{tagline}</span>}
        </div>
      </Link>
      <nav className="scrollbar-slim flex flex-1 flex-col gap-6 overflow-y-auto px-3 pt-5 pb-6">
        {groups.map((group) => (
          <div key={group.title} className="flex flex-col gap-0.5">
            <span className="mb-1 px-2.5 text-xs font-medium text-faint">{group.title}</span>
            {group.links.map((link) => {
              const active = link.href === current;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`group flex h-8 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors ${
                    active ? "bg-surface font-medium text-ink ring-1 ring-hairline" : "text-secondary hover:bg-sidebar-hover hover:text-ink"
                  }`}
                >
                  <span className={`flex shrink-0 items-center ${active ? "text-primary" : "text-faint group-hover:text-secondary"}`}>
                    {link.icon}
                  </span>
                  <span className="flex-1">{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span
                      className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums ${
                        active ? "bg-primary text-white" : "bg-surface text-secondary ring-1 ring-hairline ring-inset"
                      }`}
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
      {footer && <div className="border-t border-hairline p-3">{footer}</div>}
    </aside>
  );
};
