import { ReactNode } from "react";
import { formatMoney } from "utils";

type FigureRowProps = {
  label: ReactNode;
  amount: number;
  hint?: ReactNode;
  /** "−" for a deduction, "=" for a result. */
  sign?: "−" | "=";
  /** The figure the card is about — a hairline above it and medium weight. */
  emphasis?: boolean;
  tone?: "danger" | "success";
};

const TONES = {
  danger: "text-danger",
  success: "text-success",
};

/** One labelled amount in a card's column of figures. */
export const FigureRow = ({ label, amount, hint, sign, emphasis, tone }: FigureRowProps) => (
  <div className={`flex items-start justify-between gap-4 py-2 ${emphasis ? "mt-1 border-t border-hairline pt-3" : ""}`}>
    <div className="flex flex-col gap-0.5">
      <span className={`text-sm ${emphasis ? "font-medium text-ink" : "text-secondary"}`}>
        {sign && <span className="me-1.5 text-muted">{sign}</span>}
        {label}
      </span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
    <span dir="ltr" className={`text-sm whitespace-nowrap tabular-nums ${tone ? TONES[tone] : "text-ink"} ${emphasis ? "font-medium" : ""}`}>
      {formatMoney(amount)}
    </span>
  </div>
);
