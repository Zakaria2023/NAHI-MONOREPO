"use client";

import { Controller, useFormContext } from "react-hook-form";
import { Dropdown, DropdownOption } from "ui";

type DropdownFieldProps = {
  name: string;
  label: string;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
};

export const DropdownField = ({ name, label, options, placeholder, required }: DropdownFieldProps) => {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Dropdown
          label={label}
          options={options}
          value={typeof field.value === "string" ? field.value : ""}
          onChange={field.onChange}
          placeholder={placeholder}
          required={required}
          error={fieldState.error?.message}
        />
      )}
    />
  );
};
