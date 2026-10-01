import { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  /** Sits at the end of the title row — a button or a status. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const Card = ({ title, description, action, children, className = "" }: CardProps) => (
  <section className={`rounded-card border border-hairline bg-surface ${className}`}>
    {(title || action) && (
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline-soft px-5 py-4">
        <div className="flex flex-col gap-0.5">
          {title && <h2 className="text-base font-medium text-ink">{title}</h2>}
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {action}
      </header>
    )}
    <div className="px-5 py-4">{children}</div>
  </section>
);
