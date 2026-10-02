"use client";

import { FileSpreadsheet } from "lucide-react";
import { Button } from "ui";
import { CsvCell, useCsvDownload } from "@/lib/use-csv-download";

type CsvButtonProps = {
  filename: string;
  /** The header row first, then the data — plain values, already formatted for the reader. */
  rows: CsvCell[][];
  label?: string;
};

export const CsvButton = ({ filename, rows, label = "Export to Excel" }: CsvButtonProps) => {
  const download = useCsvDownload(filename, rows);
  return (
    <Button variant="outline" size="sm" onClick={download} className="print:hidden">
      <FileSpreadsheet size={15} />
      {label}
    </Button>
  );
};
