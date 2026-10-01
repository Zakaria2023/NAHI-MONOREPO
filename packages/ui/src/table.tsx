import { Fragment, ReactNode } from "react";
import { sortKeyOf } from "utils";
import { DataTable } from "./data-table";
import { textOf } from "./text-of";

export type TableColumn<T> = {
  key: string;
  header: string;
  align?: "start" | "end";
  /** Free text (a summary, a reason) that may wrap; every other cell stays on one line. */
  wrap?: boolean;
  render: (row: T) => ReactNode;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  /** Rows per page; a longer list gets a pager. */
  pageSize?: number;
};

/**
 * Renders every cell where the data is (on the server, for a server page), then
 * hands the finished rows to the interactive table, which sorts by each cell's
 * visible text and pages through them in the browser.
 */
export const Table = <T,>({ columns, data, rowKey, emptyMessage = "Nothing here yet.", pageSize = 10 }: TableProps<T>) => (
  <DataTable
    headers={columns.map((column) => ({ key: column.key, label: column.header, align: column.align, wrap: column.wrap }))}
    rows={data.map((row) => {
      const cells = columns.map((column) => <Fragment key={column.key}>{column.render(row)}</Fragment>);
      return { key: rowKey(row), cells, sortKeys: cells.map((cell) => sortKeyOf(textOf(cell))) };
    })}
    emptyMessage={emptyMessage}
    pageSize={pageSize}
  />
);
