"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Inbox } from "lucide-react";
import { DataTableHeader, DataTableRow, useDataTable } from "./use-data-table";

type DataTableProps = {
  headers: DataTableHeader[];
  rows: DataTableRow[];
  emptyMessage: string;
  pageSize: number;
};

// A row that links somewhere puts a stretched `Link` (absolute inset-0) in one
// of its cells; `relative` on the row is what it stretches over.
export const DataTable = ({ headers, rows, emptyMessage, pageSize }: DataTableProps) => {
  const { sort, toggleSort, visible, page, pages, pageCount, setPage, from, to, total } = useDataTable(rows, pageSize);
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-hairline bg-surface">
      <div className="scrollbar-slim overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-hairline bg-hover">
              {headers.map((header, index) => (
                <th
                  key={header.key}
                  aria-sort={sort?.index === index ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                  className={`h-14 px-3 text-sm font-medium whitespace-nowrap text-secondary first:ps-6 last:pe-6 ${header.align === "end" ? "text-end" : "text-start"}`}
                >
                  {header.label && (
                    <button
                      type="button"
                      onClick={() => toggleSort(index)}
                      className={`group inline-flex items-center gap-1.5 py-1 transition-colors hover:text-ink ${header.align === "end" ? "flex-row-reverse" : ""} ${sort?.index === index ? "text-ink" : ""}`}
                    >
                      {header.label}
                      {sort?.index === index && sort.direction === "asc" && <ArrowUp size={15} className="text-primary" />}
                      {sort?.index === index && sort.direction === "desc" && <ArrowDown size={15} className="text-primary" />}
                      {sort?.index !== index && (
                        <ChevronsUpDown size={15} className="text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          {visible.length > 0 && (
            <tbody className="divide-y divide-hairline-soft">
              {visible.map((row) => (
                <tr key={row.key} className="relative transition-colors hover:bg-primary-tint/50">
                  {row.cells.map((cell, index) => (
                    <td
                      key={headers[index]?.key ?? index}
                      className={`px-3 py-3.5 align-middle text-sm text-ink first:ps-6 last:pe-6 ${headers[index]?.align === "end" ? "text-end tabular-nums" : "text-start"} ${headers[index]?.wrap ? "min-w-64 whitespace-normal" : "whitespace-nowrap"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {total === 0 && (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-hover text-faint ring-1 ring-hairline ring-inset">
            <Inbox size={18} />
          </span>
          <p className="text-sm text-muted">{emptyMessage}</p>
        </div>
      )}

      {total > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-6 py-3">
          <span className="text-sm text-muted">
            Showing{" "}
            <span className="text-ink tabular-nums">
              {from}–{to}
            </span>{" "}
            of <span className="text-ink tabular-nums">{total}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              aria-label="Previous page"
              className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-hover hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft size={16} className="rtl:-scale-x-100" />
            </button>
            {pages.map((index, position) =>
              index === "gap" ? (
                <span key={`gap-${position}`} className="flex h-8 w-6 items-center justify-center text-sm text-faint">
                  …
                </span>
              ) : (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPage(index)}
                  aria-current={index === page ? "page" : undefined}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm tabular-nums transition-colors ${
                    index === page ? "bg-primary font-medium text-white" : "text-secondary hover:bg-hover hover:text-ink"
                  }`}
                >
                  {index + 1}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page === pageCount - 1}
              aria-label="Next page"
              className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-hover hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight size={16} className="rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
