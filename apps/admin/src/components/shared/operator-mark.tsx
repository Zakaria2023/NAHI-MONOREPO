import { OPERATOR_LABELS } from "@/db/label";
import { Operator } from "@/db/enum";

type OperatorMarkProps = {
  operator: Operator;
};

const TONES: Record<Operator, string> = {
  mobily: "bg-teal-tint text-teal",
  stc: "bg-orange-tint text-orange",
};

/** A square letter mark for the operator a project is built for. */
export const OperatorMark = ({ operator }: OperatorMarkProps) => (
  <span
    title={OPERATOR_LABELS[operator]}
    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control text-xs font-medium ${TONES[operator]}`}
  >
    {operator === "mobily" ? "MOB" : "STC"}
  </span>
);
