"use client";

import { Ref, TextareaHTMLAttributes, useId } from "react";
import { FieldLabel } from "./field-label";
import { FormError } from "./form-error";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  ref?: Ref<HTMLTextAreaElement>;
};

export const Textarea = ({ label, error, id, required, className = "", ref, ...props }: TextareaProps) => {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <FieldLabel htmlFor={inputId} required={required}>
          {label}
        </FieldLabel>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={3}
        className={`w-full rounded-control border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-primary focus:ring-4 focus:ring-primary/10 ${error ? "border-danger" : "border-search-border"} ${className}`}
        {...props}
      />
      <FormError message={error} />
    </div>
  );
};
