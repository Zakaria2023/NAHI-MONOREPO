import { StatusPill } from "ui";
import { OPERATOR_LABELS } from "@/db/label";
import { Operator } from "@/db/enum";

type OperatorPillProps = {
  operator: Operator;
};

export const OperatorPill = ({ operator }: OperatorPillProps) => (
  <StatusPill tone={operator === "mobily" ? "info" : "neutral"}>{OPERATOR_LABELS[operator]}</StatusPill>
);
