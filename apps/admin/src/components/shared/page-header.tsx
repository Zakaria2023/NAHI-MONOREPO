import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** The screen's one primary action: a link to a create form. */
  action?: { href: string; label: string };
  back?: { href: string; label: string };
  /** Status pills or facts beside the title. */
  meta?: ReactNode;
};

export const PageHeader = ({ title, description, action, back, meta }: PageHeaderProps) => (
  <div className="flex flex-col gap-3">
    {back && (
      <Link href={back.href} className="flex w-fit items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} className="rtl:-scale-x-100" />
        {back.label}
      </Link>
    )}
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl text-ink">{title}</h1>
          {meta}
        </div>
        {description && <p className="max-w-3xl text-sm text-muted">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="flex shrink-0 items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          <Plus size={16} />
          {action.label}
        </Link>
      )}
    </div>
  </div>
);
