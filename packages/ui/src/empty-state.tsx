import { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  children?: ReactNode;
};

export const EmptyState = ({ title, children }: EmptyStateProps) => (
  <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-hairline px-6 py-12 text-center">
    <p className="text-sm font-medium text-ink">{title}</p>
    {children && <div className="text-sm text-muted">{children}</div>}
  </div>
);
