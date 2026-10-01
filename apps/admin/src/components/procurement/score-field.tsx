"use client";

import { DropdownField } from "@/components/forms/dropdown-field";

type ScoreFieldProps = {
  name: string;
  label: string;
};

const SCORES = [
  { value: "5", label: "5 — Excellent" },
  { value: "4", label: "4 — Good" },
  { value: "3", label: "3 — Acceptable" },
  { value: "2", label: "2 — Weak" },
  { value: "1", label: "1 — Poor" },
];

/** A 1–5 score, for a quotation's quality or a supplier's evaluation. */
export const ScoreField = ({ name, label }: ScoreFieldProps) => <DropdownField name={name} label={label} options={SCORES} required />;
