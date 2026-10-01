"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

export type DropdownOption = {
  value: string;
  label: string;
  /** A second, quieter line — a code, a balance, a role. */
  hint?: string;
};

/** The open/close, search, keyboard and outside-click behaviour of `Dropdown`. */
export const useDropdown = (
  options: DropdownOption[],
  value: string,
  onChange: (value: string) => void,
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(term))
      : options;
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [isOpen]);

  const toggle = () => {
    setIsOpen((open) => !open);
    setQuery("");
    setActiveIndex(0);
  };

  const choose = (next: string) => {
    onChange(next);
    setIsOpen(false);
    setQuery("");
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === "ArrowDown" || event.key === "Enter") {
        event.preventDefault();
        toggle();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const row = rows[activeIndex];
      if (row) {
        choose(row.value);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return { isOpen, query, setQuery, rows, selected, activeIndex, containerRef, toggle, choose, onKeyDown };
};
