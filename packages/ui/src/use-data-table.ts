"use client";

import { ReactNode, useMemo, useState } from "react";
import { compareSortKeys, SortKey } from "utils";

export type DataTableHeader = {
  key: string;
  label: string;
  align?: "start" | "end";
  wrap?: boolean;
};

/** A row already rendered where the data is: its cells, and the key each one sorts by. */
export type DataTableRow = {
  key: string;
  cells: ReactNode[];
  sortKeys: SortKey[];
};

type SortState = {
  index: number;
  direction: "asc" | "desc";
} | null;

/** Sorting (header click: ascending, descending, off) and paging over finished rows. */
export const useDataTable = (rows: DataTableRow[], pageSize: number) => {
  const [sort, setSort] = useState<SortState>(null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort) {
      return rows;
    }
    const sign = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = a.sortKeys[sort.index] ?? null;
      const right = b.sortKeys[sort.index] ?? null;
      // Empty cells stay at the bottom whichever way the column is sorted.
      if (left === null || right === null) {
        return left === right ? 0 : left === null ? 1 : -1;
      }
      return compareSortKeys(left, right) * sign;
    });
  }, [rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pageCount - 1);

  const toggleSort = (index: number) => {
    setSort((prev) => {
      if (!prev || prev.index !== index) {
        return { index, direction: "asc" };
      }
      return prev.direction === "asc" ? { index, direction: "desc" } : null;
    });
    setPage(0);
  };

  // First, last, and the current page with a neighbour each side; a gap marks what is skipped.
  const pages = Array.from({ length: pageCount }, (_, index) => index)
    .filter((index) => index === 0 || index === pageCount - 1 || Math.abs(index - current) <= 1)
    .flatMap((index, position, kept) => (position > 0 && index - kept[position - 1] > 1 ? ["gap" as const, index] : [index]));

  return {
    sort,
    pages,
    toggleSort,
    visible: sorted.slice(current * pageSize, (current + 1) * pageSize),
    page: current,
    pageCount,
    setPage,
    from: sorted.length === 0 ? 0 : current * pageSize + 1,
    to: Math.min(sorted.length, (current + 1) * pageSize),
    total: sorted.length,
  };
};
