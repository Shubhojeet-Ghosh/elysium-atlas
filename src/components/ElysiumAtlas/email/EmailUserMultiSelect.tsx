"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailUserMultiSelectItem {
  value: string;
  label: string;
  description?: string;
}

interface EmailUserMultiSelectProps {
  items: EmailUserMultiSelectItem[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  className?: string;
  listMaxHeightClass?: string;
}

function getSelectionLabel(
  items: EmailUserMultiSelectItem[],
  selectedIds: string[],
  placeholder: string,
) {
  if (selectedIds.length === 0) {
    return placeholder;
  }

  if (selectedIds.length === 1) {
    const selected = items.find((item) => item.value === selectedIds[0]);
    return selected?.label ?? "1 selected";
  }

  return `${selectedIds.length} selected`;
}

export default function EmailUserMultiSelect({
  items,
  selectedIds,
  onChange,
  placeholder = "Select team members...",
  emptyMessage = "No team members found.",
  searchPlaceholder = "Search team members...",
  className,
  listMaxHeightClass = "max-h-[220px]",
}: EmailUserMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query),
    );
  }, [items, searchQuery]);

  const toggleSelection = (itemValue: string) => {
    if (selectedIds.includes(itemValue)) {
      onChange(selectedIds.filter((id) => id !== itemValue));
      return;
    }

    onChange([...selectedIds, itemValue]);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          className,
        )}
      >
        <span
          className={cn(
            "truncate text-left",
            selectedIds.length === 0 && "text-muted-foreground",
          )}
        >
          {getSelectionLabel(items, selectedIds, placeholder)}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "flex h-9 w-full rounded-md bg-transparent pl-9 pr-3 py-1 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border",
                  className,
                )}
                autoFocus
              />
            </div>
          </div>
          <div className={cn("overflow-y-auto p-1", listMaxHeightClass)}>
            {filteredItems.length === 0 ? (
              <div
                className={cn(
                  "py-6 text-center text-muted-foreground text-[13px]",
                  className,
                )}
              >
                {emptyMessage}
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedIds.includes(item.value);

                return (
                  <div
                    key={item.value}
                    onClick={() => toggleSelection(item.value)}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-2 outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                      className,
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate text-[13px]">{item.label}</div>
                      {item.description && (
                        <div className="truncate text-[11px] text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
