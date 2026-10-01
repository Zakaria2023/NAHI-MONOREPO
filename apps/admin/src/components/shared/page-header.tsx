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
  <div className="flex flex-col gap-4 border-b border-hairline pb-7">
    {back && (
      <Link
        href={back.href}
        className="flex w-fit items-center gap-1.5 rounded-full border border-hairline py-1 ps-2 pe-3 text-xs font-medium text-secondary transition-colors hover:bg-hover hover:text-ink"
      >
        <ArrowLeft size={13} className="rtl:-scale-x-100" />
        {back.label}
      </Link>
    )}
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-medium tracking-tight text-ink">{title}</h1>
          {meta}
        </div>
        {description && <p className="max-w-3xl text-base text-muted">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary ps-4 pe-5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <Plus size={16} />
          {action.label}
        </Link>
      )}
    </div>
  </div>
);
