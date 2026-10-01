"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "ui";

type TextFieldProps = {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "datetime-local";
  placeholder?: string;
  required?: boolean;
  step?: string;
};

export const TextField = ({ name, label, type = "text", placeholder, required, step }: TextFieldProps) => {
  const { register, getFieldState, formState } = useFormContext();
  return (
    <Input
      {...register(name)}
      type={type}
      label={label}
      placeholder={placeholder}
      required={required}
      step={step ?? (type === "number" ? "any" : undefined)}
      error={getFieldState(name, formState).error?.message}
    />
  );
};
