"use client";

import { useCallback } from "react";

export type CsvCell = string | number | null | undefined;

const escape = (cell: CsvCell): string => {
  const text = cell === null || cell === undefined ? "" : String(cell);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * Builds a CSV in the browser and saves it — the Excel export the documents ask
 * for, with no server round trip. The leading byte-order mark makes Excel read
 * the file as UTF-8, so Arabic names come through.
 */
export const useCsvDownload = (filename: string, rows: CsvCell[][]) =>
  useCallback(() => {
    const csv = `﻿${rows.map((row) => row.map(escape).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [filename, rows]);
