"use client";

import { InputHTMLAttributes, Ref, useId } from "react";
import { FieldLabel } from "./field-label";
import { FormError } from "./form-error";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

export const Input = ({ label, error, id, required, className = "", ref, ...props }: InputProps) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      )}
      <input
        ref={ref}
        id={inputId}
        required={required}
        className={`w-full rounded-control border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-tint ${error ? "border-danger" : "border-search-border"} ${className}`}
        {...props}
      />
      <FormError message={error} />
    </div>
  );
};
