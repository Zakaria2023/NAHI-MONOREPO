"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useId } from "react";
import { FieldLabel } from "./field-label";
import { FormError } from "./form-error";
import { DropdownOption, useDropdown } from "./use-dropdown";

type DropdownProps = {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  /** Fixed text on the trigger, for a menu that is an action rather than a value ("Switch user"). */
  triggerLabel?: string;
};

/** The one select control in the system — never a native `<select>`. Searchable past eight options. */
export const Dropdown = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Select…",
  required,
  error,
  disabled,
  triggerLabel,
}: DropdownProps) => {
  const listboxId = useId();
  const { isOpen, query, setQuery, rows, selected, activeIndex, containerRef, toggle, choose, onKeyDown } =
    useDropdown(options, value, onChange);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <FieldLabel required={required}>{label}</FieldLabel>}
      <div ref={containerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={toggle}
          onKeyDown={onKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          className={`flex w-full items-center justify-between gap-2 rounded-control border bg-surface px-3 py-2 text-start text-sm outline-none transition-colors focus:border-primary disabled:opacity-60 ${error ? "border-danger" : "border-search-border"}`}
        >
          <span className={selected || triggerLabel ? "text-ink" : "text-faint"}>{triggerLabel ?? selected?.label ?? placeholder}</span>
          <ChevronDown size={16} className="shrink-0 text-muted" />
        </button>

        {isOpen && (
          <div className="absolute inset-x-0 top-full z-50 mt-1 flex max-h-72 flex-col overflow-hidden rounded-control border border-hairline bg-overlay shadow-lg">
            {options.length > 8 && (
              <div className="relative border-b border-hairline-soft p-2">
                <Search size={14} className="pointer-events-none absolute top-1/2 inset-s-4 -translate-y-1/2 text-faint" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Search…"
                  className="w-full rounded-control border border-search-border bg-surface py-1.5 ps-8 pe-2 text-sm outline-none focus:border-primary"
                />
              </div>
            )}
            <ul id={listboxId} role="listbox" className="scrollbar-slim overflow-y-auto py-1">
              {rows.length === 0 && <li className="px-3 py-2 text-sm text-muted">No results</li>}
              {rows.map((option, index) => (
                <li key={option.value} role="option" aria-selected={option.value === value}>
                  <button
                    type="button"
                    onClick={() => choose(option.value)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-start text-sm ${index === activeIndex ? "bg-hover" : ""} hover:bg-hover`}
                  >
                    <span className="flex flex-col">
                      <span className="text-ink">{option.label}</span>
                      {option.hint && <span className="text-xs text-muted">{option.hint}</span>}
                    </span>
                    {option.value === value && <Check size={14} className="shrink-0 text-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <FormError message={error} />
    </div>
  );
};
