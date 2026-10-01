"use client";

import { useFormContext } from "react-hook-form";
import { Checkbox } from "ui";

type CheckboxFieldProps = {
  name: string;
  label: string;
};

export const CheckboxField = ({ name, label }: CheckboxFieldProps) => {
  const { register } = useFormContext();
  return <Checkbox {...register(name)} label={label} />;
};
