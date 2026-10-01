import { Inbox } from "lucide-react";
import { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  children?: ReactNode;
};

export const EmptyState = ({ title, children }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-hairline px-6 py-12 text-center">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hover text-faint ring-1 ring-hairline ring-inset">
      <Inbox size={18} />
    </div>
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-ink">{title}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  </div>
);
