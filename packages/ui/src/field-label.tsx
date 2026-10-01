import { ReactNode } from "react";

type FieldLabelProps = {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
};

export const FieldLabel = ({ htmlFor, required, children }: FieldLabelProps) => (
  <label htmlFor={htmlFor} className="text-sm font-medium text-secondary">
    {children}
    {required && <span className="ms-0.5 text-danger">*</span>}
  </label>
);
