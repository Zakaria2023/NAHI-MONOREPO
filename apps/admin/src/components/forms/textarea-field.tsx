"use client";

import { useFormContext } from "react-hook-form";
import { Textarea } from "ui";

type TextareaFieldProps = {
  name: string;
  label: string;
  placeholder?: string;
};

export const TextareaField = ({ name, label, placeholder }: TextareaFieldProps) => {
  const { register, getFieldState, formState } = useFormContext();
  return (
    <Textarea
      {...register(name)}
      label={label}
      placeholder={placeholder}
      error={getFieldState(name, formState).error?.message}
    />
  );
};
