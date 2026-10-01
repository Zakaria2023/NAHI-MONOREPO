import { ReactNode } from "react";

type Fact = {
  label: string;
  value: ReactNode;
};

type FactListProps = {
  facts: Fact[];
  columns?: 1 | 2 | 3 | 4;
};

const COLUMNS = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

export const FactList = ({ facts, columns = 2 }: FactListProps) => (
  <dl className={`grid gap-x-6 gap-y-3 ${COLUMNS[columns]}`}>
    {facts.map((fact) => (
      <div key={fact.label} className="flex flex-col gap-0.5">
        <dt className="text-xs text-muted">{fact.label}</dt>
        <dd className="text-sm text-ink">{fact.value}</dd>
      </div>
    ))}
  </dl>
);
