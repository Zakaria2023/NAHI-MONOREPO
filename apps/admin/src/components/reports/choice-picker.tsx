"use client";

import { Dropdown } from "ui";
import { useChoicePicker } from "@/lib/use-choice-picker";

type ChoicePickerProps = {
  label: string;
  options: { value: string; label: string; href: string }[];
  selected: string;
};

/** A long list of choices (every ledger account): picking one opens the report for it. */
export const ChoicePicker = ({ label, options, selected }: ChoicePickerProps) => {
  const { choose, isPending } = useChoicePicker(options);
  return (
    <div className={isPending ? "opacity-60" : ""}>
      <Dropdown label={label} options={options.map((o) => ({ value: o.value, label: o.label }))} value={selected} onChange={choose} />
    </div>
  );
};
