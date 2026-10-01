"use client";

import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Button, Dropdown, DropdownOption, FormError } from "ui";

export type LineColumn = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: DropdownOption[];
  /** Tailwind column span out of 12. */
  span?: 2 | 3 | 4 | 5 | 6;
};

type LinesFieldProps = {
  name: string;
  label: string;
  columns: LineColumn[];
  emptyRow: Record<string, string | number>;
  /** Fixed rows (a stocktake's items, a receipt's PO lines) cannot be added or removed. */
  fixed?: boolean;
};

const SPAN: Record<NonNullable<LineColumn["span"]>, string> = {
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
};

/** Any form's repeatable lines — items with quantities, priced lines, extract quantities. */
export const LinesField = ({ name, label, columns, emptyRow, fixed }: LinesFieldProps) => {
  const { control, register, getFieldState, formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name });
  const rootError = getFieldState(name, formState).error;

  return (
    <div className="flex flex-col gap-2 md:col-span-full">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="flex flex-col gap-2 rounded-control border border-hairline-soft p-3">
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 items-start gap-2 md:grid-cols-12">
            {columns.map((column) => {
              const path = `${name}.${index}.${column.name}`;
              const error = getFieldState(path, formState).error?.message;
              return (
                <div key={column.name} className={`flex flex-col gap-1 ${SPAN[column.span ?? 3]}`}>
                  {index === 0 && <span className="text-xs text-muted">{column.label}</span>}
                  {column.type === "select" ? (
                    <Controller
                      control={control}
                      name={path}
                      render={({ field: f }) => (
                        <Dropdown
                          options={column.options ?? []}
                          value={typeof f.value === "string" ? f.value : ""}
                          onChange={f.onChange}
                          error={error}
                        />
                      )}
                    />
                  ) : (
                    <>
                      <input
                        {...register(path)}
                        type={column.type}
                        step={column.type === "number" ? "any" : undefined}
                        aria-label={column.label}
                        className={`w-full rounded-control border bg-surface px-3 py-2 text-sm outline-none focus:border-primary ${error ? "border-danger" : "border-search-border"}`}
                      />
                      <FormError message={error} />
                    </>
                  )}
                </div>
              );
            })}
            {!fixed && (
              <div className={`flex md:col-span-1 ${index === 0 ? "md:pt-5" : ""}`}>
                <Button variant="ghost" size="sm" onClick={() => remove(index)} aria-label="Remove line">
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>
        ))}
        {!fixed && (
          <div>
            <Button variant="outline" size="sm" onClick={() => append(emptyRow)}>
              <Plus size={14} />
              Add line
            </Button>
          </div>
        )}
      </div>
      <FormError message={rootError?.message ?? rootError?.root?.message} />
    </div>
  );
};
