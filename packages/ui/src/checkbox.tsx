"use client";

import { InputHTMLAttributes, Ref, useId } from "react";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  ref?: Ref<HTMLInputElement>;
};

export const Checkbox = ({ label, id, className = "", ref, ...props }: CheckboxProps) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  return (
    <label htmlFor={inputId} className="flex w-fit cursor-pointer items-center gap-2 text-sm text-ink">
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className={`h-4 w-4 cursor-pointer accent-primary ${className}`}
        {...props}
      />
      {label}
    </label>
  );
};
