"use client";

import { Printer } from "lucide-react";
import { Button } from "ui";

type PrintButtonProps = {
  label?: string;
};

/** The browser's print dialog — "Save as PDF" there is the PDF export. The app's chrome hides itself on paper. */
export const PrintButton = ({ label = "Print / PDF" }: PrintButtonProps) => (
  <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
    <Printer size={15} />
    {label}
  </Button>
);
