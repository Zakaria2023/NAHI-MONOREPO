import { ReactNode } from "react";

export type TableColumn<T> = {
  key: string;
  header: string;
  align?: "start" | "end";
  render: (row: T) => ReactNode;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
};

// A row that links somewhere puts a stretched `Link` (absolute inset-0) in one
// of its cells; `relative` on the row is what it stretches over.
export const Table = <T,>({ columns, data, rowKey, emptyMessage = "Nothing here yet." }: TableProps<T>) => (
  <div className="overflow-x-auto rounded-card border border-hairline bg-surface">
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-hairline bg-hover">
          {columns.map((column) => (
            <th
              key={column.key}
              className={`px-5 py-3 text-xs font-medium tracking-wider whitespace-nowrap text-muted uppercase ${column.align === "end" ? "text-end" : "text-start"}`}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      {data.length > 0 && (
        <tbody className="divide-y divide-hairline-soft">
          {data.map((row) => (
            <tr key={rowKey(row)} className="relative transition-colors hover:bg-primary-tint/40">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-5 py-3.5 align-top text-sm text-ink ${column.align === "end" ? "text-end tabular-nums" : "text-start"}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      )}
    </table>
    {data.length === 0 && <div className="px-5 py-14 text-center text-sm text-muted">{emptyMessage}</div>}
  </div>
);
