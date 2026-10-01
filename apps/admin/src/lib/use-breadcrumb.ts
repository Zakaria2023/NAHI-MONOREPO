"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { activeNavHref } from "utils";

type Crumb = {
  group: string;
  label: string;
  href: string;
};

/** The menu entry that covers the current path — the same one the sidebar lights. */
export const useBreadcrumb = (crumbs: Crumb[]) => {
  const pathname = usePathname();
  return useMemo(() => {
    const href = activeNavHref(
      pathname,
      crumbs.map((c) => c.href),
    );
    return { crumb: crumbs.find((c) => c.href === href), isDeeper: href !== pathname };
  }, [pathname, crumbs]);
};
