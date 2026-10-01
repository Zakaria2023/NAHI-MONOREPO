"use client";

import { useFormContext } from "react-hook-form";
import { Textarea } from "ui";

type TextareaFieldProps = {
  name: string;
  label: string;
  placeholder?: string;
};

export const TextareaField = ({ name, label, placeholder }: TextareaFieldProps) => {
  const { register, getFieldState, getValues, formState } = useFormContext();
  const initial: unknown = getValues(name);
  return (
    <Textarea
      {...register(name)}
      defaultValue={typeof initial === "string" ? initial : undefined}
      label={label}
      placeholder={placeholder}
      error={getFieldState(name, formState).error?.message}
    />
  );
};
