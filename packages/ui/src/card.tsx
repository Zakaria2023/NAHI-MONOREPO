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
  <section className={`flex flex-col rounded-card border border-hairline bg-surface ${className}`}>
    {(title || action) && (
      <header className="flex items-start justify-between gap-4 px-6 pt-5">
        <div className="flex flex-col gap-1">
          {title && <h2 className="text-base font-medium tracking-tight text-ink">{title}</h2>}
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {action}
      </header>
    )}
    <div className={title || action ? "px-6 pt-5 pb-6" : "p-6"}>{children}</div>
  </section>
);
