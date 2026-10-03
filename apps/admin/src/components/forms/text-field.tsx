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
  const { register, getFieldState, getValues, formState } = useFormContext();
  const initial: unknown = getValues(name);
  return (
    <Input
      {...register(name)}
      // Rendered on the server too, so the field is filled before hydration.
      defaultValue={typeof initial === "string" || typeof initial === "number" ? initial : undefined}
      type={type}
      label={label}
      placeholder={placeholder}
      required={required}
      step={step ?? (type === "number" ? "any" : undefined)}
      error={getFieldState(name, formState).error?.message}
    />
  );
};
