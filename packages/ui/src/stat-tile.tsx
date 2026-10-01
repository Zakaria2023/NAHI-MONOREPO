import { ReactNode } from "react";

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
};

export const StatTile = ({ label, value, hint, icon }: StatTileProps) => (
  <div className="flex flex-col gap-2 rounded-card border border-hairline bg-surface px-5 py-4">
    <div className="flex items-center justify-between gap-2 text-sm text-muted">
      <span>{label}</span>
      {icon && <span className="text-faint">{icon}</span>}
    </div>
    <div className="text-2xl text-ink">{value}</div>
    {hint && <p className="text-xs text-muted">{hint}</p>}
  </div>
);
