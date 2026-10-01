import { ArrowLeftRight, ClipboardCheck, PackageMinus, PackageX } from "lucide-react";
import Link from "next/link";

const LINKS = [
  { href: "/warehouse/issue-requests/new", label: "Issue request", icon: <PackageMinus size={15} /> },
  { href: "/warehouse/transfers/new", label: "Transfer", icon: <ArrowLeftRight size={15} /> },
  { href: "/warehouse/stocktakes/new", label: "Stocktake", icon: <ClipboardCheck size={15} /> },
  { href: "/warehouse/write-offs/new", label: "Write-off", icon: <PackageX size={15} /> },
];

/** One button per warehouse document kind, each opening its create form. */
export const NewDocumentLinks = () => (
  <div className="flex flex-wrap gap-2">
    {LINKS.map((link, index) => (
      <Link
        key={link.href}
        href={link.href}
        className={`flex items-center gap-1.5 rounded-control px-3 py-2 text-sm font-medium transition-colors ${
          index === 0 ? "bg-primary text-white hover:bg-primary-hover" : "border border-hairline bg-surface text-ink hover:bg-hover"
        }`}
      >
        {link.icon}
        {link.label}
      </Link>
    ))}
  </div>
);
