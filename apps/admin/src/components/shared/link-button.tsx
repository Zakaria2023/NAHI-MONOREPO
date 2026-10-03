import Link from "next/link";
import { ReactNode } from "react";

type LinkButtonProps = {
  href: string;
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "outline";
};

const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  outline: "border border-hairline bg-surface text-ink hover:border-search-border hover:bg-hover",
};

/** A link to a large form's own page, looking like the button it replaces. */
export const LinkButton = ({ href, label, icon, variant = "primary" }: LinkButtonProps) => (
  <Link href={href} className={`inline-flex h-10 w-fit items-center gap-2 rounded-full px-5 text-sm font-medium whitespace-nowrap transition-colors ${VARIANTS[variant]}`}>
    {icon}
    {label}
  </Link>
);
