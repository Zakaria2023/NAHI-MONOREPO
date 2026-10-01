"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useBreadcrumb } from "@/lib/use-breadcrumb";

type BreadcrumbProps = {
  crumbs: { group: string; label: string; href: string }[];
};

/** Where the screen sits in the menu: its group, then its entry. */
export const Breadcrumb = ({ crumbs }: BreadcrumbProps) => {
  const { crumb, isDeeper } = useBreadcrumb(crumbs);
  if (!crumb) {
    return null;
  }
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <span className="text-muted">{crumb.group}</span>
      <ChevronRight size={14} className="text-faint rtl:-scale-x-100" />
      {isDeeper ? (
        <>
          <Link href={crumb.href} className="text-muted transition-colors hover:text-ink">
            {crumb.label}
          </Link>
          <ChevronRight size={14} className="text-faint rtl:-scale-x-100" />
          <span className="font-medium text-ink">Details</span>
        </>
      ) : (
        <span className="font-medium text-ink">{crumb.label}</span>
      )}
    </nav>
  );
};
