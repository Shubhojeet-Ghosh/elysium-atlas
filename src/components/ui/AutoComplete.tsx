"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutoCompleteItem {
  value: string;
  label: string;
}

interface AutoCompleteProps {
  items: AutoCompleteItem[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  emptyMessage?: string;
  onChange?: (value: string) => void;
  className?: string;
  searchPlaceholder?: string;
}

export default function AutoComplete({
  items,
  value,
  defaultValue = "",
  placeholder = "Select option...",
  emptyMessage = "No results found.",
  onChange,
  className,
  searchPlaceholder = "Search...",
}: AutoCompleteProps) {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

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

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedItem = items.find((item) => item.value === selectedValue);

  const handleSelect = (itemValue: string) => {
    setSelectedValue(itemValue);
    onChange?.(itemValue);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          className
        )}
      >
        <span className={cn(!selectedItem && "text-muted-foreground")}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
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
                  className
                )}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredItems.length === 0 ? (
              <div
                className={cn(
                  "py-6 text-center text-muted-foreground",
                  className
                )}
              >
                {emptyMessage}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.value}
                  onClick={() => handleSelect(item.value)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                    className
                  )}
                >
                  {item.label}
                  <Check
                    className={cn(
                      "h-4 w-4",
                      selectedValue === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
