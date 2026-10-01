import { ReactNode } from "react";

type StatStripProps = {
  /** The grid columns per breakpoint, e.g. "sm:grid-cols-2 xl:grid-cols-4". */
  columns: string;
  children: ReactNode;
};

/** Stat tiles joined into one panel; the 1px gap over a hairline background draws the dividers. */
export const StatStrip = ({ columns, children }: StatStripProps) => (
  <div className={`grid grid-cols-1 gap-px overflow-hidden rounded-card border border-hairline bg-hairline ${columns}`}>{children}</div>
);
