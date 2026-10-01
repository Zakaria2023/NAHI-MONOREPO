"use client";

import { useFormContext } from "react-hook-form";
import { Checkbox } from "ui";

type CheckboxFieldProps = {
  name: string;
  label: string;
};

export const CheckboxField = ({ name, label }: CheckboxFieldProps) => {
  const { register, getValues } = useFormContext();
  return <Checkbox {...register(name)} defaultChecked={Boolean(getValues(name))} label={label} />;
};
