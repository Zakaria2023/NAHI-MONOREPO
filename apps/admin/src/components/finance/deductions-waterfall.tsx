import { ExtractFigures } from "services";
import { Card } from "ui";
import { formatPercent } from "utils";
import { ProgressBar } from "@/components/shared/progress-bar";
import { FigureRow } from "./figure-row";

type DeductionsWaterfallProps = {
  figures: ExtractFigures;
  retentionPct: number;
  penaltyNote?: string;
  /** Still in review — the figures are a preview, recomputed at each approval. */
  pending: boolean;
};

/** Finance §2 steps 3–7: gross less advance, retention, penalties and materials issued = net due. */
export const DeductionsWaterfall = ({ figures, retentionPct, penaltyNote, pending }: DeductionsWaterfallProps) => {
  const share = (amount: number) => (figures.gross > 0 ? amount / figures.gross : 0);
  const deductions = [
    { label: "Advance recovered", amount: figures.advanceDeduction, hint: "In proportion to the extract's share of the contract" },
    { label: `Retention ${retentionPct}%`, amount: figures.retention, hint: "Held until the contract's release" },
    { label: "Penalties", amount: figures.penalties, hint: penaltyNote ?? "Delay or breach, set by an approver" },
    { label: "Materials issued", amount: figures.materialsDeduction, hint: "Issued from the warehouse to the subcontractor on this project" },
  ];
  return (
    <Card
      title="Deductions"
      description={
        pending
          ? "A preview: recomputed at every approval and frozen at the last, so a late issue of materials is not missed."
          : "Frozen when finance approved the extract."
      }
    >
      <div className="flex flex-col">
        <FigureRow label="Gross" amount={figures.gross} emphasis />
        {deductions.map((d) => (
          <div key={d.label} className="flex flex-col gap-1 pb-1">
            <FigureRow label={d.label} amount={d.amount} hint={d.hint} sign="−" />
            {d.amount > 0 && (
              <div className="flex items-center gap-2">
                <ProgressBar value={share(d.amount)} />
                <span className="w-12 shrink-0 text-end text-xs text-muted">{formatPercent(share(d.amount))}</span>
              </div>
            )}
          </div>
        ))}
        <FigureRow label="Net due" amount={figures.net} sign="=" emphasis tone={figures.net < 0 ? "danger" : "success"} />
      </div>
    </Card>
  );
};
