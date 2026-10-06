"use client";

import * as React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: (SearchableOption | string)[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  contentClassName?: string;
  popoverWidth?: string;
  disabled?: boolean;
  clearable?: boolean;
  size?: "default" | "sm" | "xs";
  align?: "start" | "center" | "end";
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value = "",
  onValueChange,
  options = [],
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No matches found.",
  className,
  contentClassName,
  popoverWidth,
  disabled = false,
  clearable = false,
  size = "default",
  align = "start",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to object shape
  const normalizedOptions = useMemo<SearchableOption[]>(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((opt) => {
      return (
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
      );
    });
  }, [normalizedOptions, search]);

  // Auto focus search input when popover opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearch("");
    }
  }, [open]);

  // Keyboard navigation inside search input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        const firstAvailable = filteredOptions.find((o) => !o.disabled);
        if (firstAvailable) {
          onValueChange(firstAvailable.value);
          setOpen(false);
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            aria-expanded={open}
            className={cn(
              "flex items-center justify-between border border-border bg-card text-foreground font-medium transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
              size === "sm"
                ? "h-7 px-2.5 text-xs rounded-md"
                : size === "xs"
                ? "h-7 px-2 text-[11px] rounded-md"
                : "h-7 px-3 text-xs sm:text-sm rounded-md",
              className
            )}
          >
            <span className="flex items-center gap-1.5 min-w-0 truncate text-left">
              {selectedOption?.icon && (
                <span className="shrink-0 text-sm leading-none">{selectedOption.icon}</span>
              )}
              <span
                className={cn(
                  "truncate",
                  !selectedOption && "text-muted-foreground font-normal"
                )}
              >
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </span>

            <div className="flex items-center gap-1 shrink-0 ml-1.5">
              {clearable && value && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onValueChange("");
                  }}
                  className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Clear"
                >
                  <X className="h-3 w-3" />
                </span>
              )}
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-60 shrink-0" />
            </div>
          </button>
        }
      />
      <PopoverContent
        align={align}
        sideOffset={4}
        className={cn(
          "p-1 gap-1 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg min-w-[200px] w-auto max-w-sm z-50",
          popoverWidth,
          contentClassName
        )}
      >
        {/* Search Header */}
        <div className="relative px-1 pt-1 pb-1 border-b border-border/60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8 pr-7 h-7 text-xs bg-muted/40 border-transparent focus-visible:border-border"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Scrollable Items List */}
        <div className="max-h-60 overflow-y-auto p-0.5 space-y-0.5 overscroll-contain">
          {filteredOptions.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer select-none text-left",
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-muted text-foreground",
                    opt.disabled && "opacity-40 pointer-events-none"
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0 truncate">
                    {opt.icon && (
                      <span className="shrink-0 text-sm leading-none">{opt.icon}</span>
                    )}
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-muted-foreground shrink-0 font-normal">
                        ({opt.sublabel})
                      </span>
                    )}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary ml-2" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
