import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { OverviewSection } from "services";
import { formatCompactMoney, formatMoney } from "utils";

type OverviewCardProps = {
  section: OverviewSection;
  icon: ReactNode;
  /** The icon chip's colour classes. */
  chip: string;
};

const VALUE_TONES = {
  neutral: "text-ink",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

/** One area of the company: its state in a line, and its figures, each opening its screen. */
export const OverviewCard = ({ section, icon, chip }: OverviewCardProps) => (
  <section className="flex flex-col rounded-card border border-hairline bg-surface">
    <header className="group relative flex items-start gap-3 border-b border-hairline-soft px-5 py-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${chip}`}>{icon}</span>
      <div className="flex flex-1 flex-col gap-0.5">
        <Link href={section.href} className="text-base font-medium tracking-tight text-ink after:absolute after:inset-0">
          {section.title}
        </Link>
        <span className="text-xs text-muted">{section.summary}</span>
      </div>
      <ArrowUpRight size={16} className="mt-1 text-faint transition-colors group-hover:text-primary rtl:-scale-x-100" />
    </header>
    <dl className="grid grid-cols-2 gap-px bg-hairline-soft">
      {section.figures.map((f) => (
        <div key={f.label} className="relative flex flex-col gap-1 bg-surface px-5 py-3.5 transition-colors last:odd:col-span-2 hover:bg-hover">
          <dt className="text-xs text-muted">
            <Link href={f.href} className="after:absolute after:inset-0">
              {f.label}
            </Link>
          </dt>
          <dd className={`text-lg font-medium tracking-tight ${VALUE_TONES[f.tone]}`} title={f.kind === "money" ? formatMoney(f.value) : undefined}>
            {f.kind === "money" ? formatCompactMoney(f.value) : f.kind === "hours" ? `${f.value} h` : f.value}
          </dd>
        </div>
      ))}
    </dl>
  </section>
);
