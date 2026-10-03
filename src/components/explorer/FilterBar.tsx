import React, { useEffect, useRef, useState } from "react";
import { Search, X, RotateCcw, Filter, ChevronDown, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import type { MatchFilters, Bookmaker } from "../../lib/types";
import { DATASETS } from "../../lib/data";

interface FilterBarProps {
  filters: MatchFilters;
  onFilterChange: (filters: MatchFilters) => void;
  onReset: () => void;
  uniqueLeagues: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  uniqueLeagues,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [jackpotMenuOpen, setJackpotMenuOpen] = useState(false);
  const jackpotRef = useRef<HTMLDivElement>(null);

  // Debounced search state
  const [searchValue, setSearchValue] = useState(filters.search);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const latestFiltersRef = useRef(filters);
  const onFilterChangeRef = useRef(onFilterChange);

  useEffect(() => {
    latestFiltersRef.current = filters;
    onFilterChangeRef.current = onFilterChange;
  });

  // Sync if external filter change occurred (e.g. Reset or URL change)
  useEffect(() => {
    setSearchValue(filters.search);
    setIsDebouncing(false);
  }, [filters.search]);

  // Debounce search by 300ms
  useEffect(() => {
    if (searchValue === filters.search) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      onFilterChangeRef.current({
        ...latestFiltersRef.current,
        search: searchValue,
      });
      setIsDebouncing(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, filters.search]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsDebouncing(false);
      onFilterChangeRef.current({
        ...latestFiltersRef.current,
        search: searchValue,
      });
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSearchValue("");
      setIsDebouncing(false);
      onFilterChangeRef.current({
        ...latestFiltersRef.current,
        search: "",
      });
      searchInputRef.current?.blur();
    }
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setIsDebouncing(false);
    onFilterChangeRef.current({
      ...latestFiltersRef.current,
      search: "",
    });
    searchInputRef.current?.focus();
  };

  // Keyboard shortcut listener for CMD+K or '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close jackpot menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (jackpotRef.current && !jackpotRef.current.contains(e.target as Node)) {
        setJackpotMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.bookmakers.length > 0 ||
    filters.jackpots.length > 0 ||
    filters.results.length > 0 ||
    Boolean(filters.from) ||
    Boolean(filters.to) ||
    filters.minOdds !== null ||
    filters.maxOdds !== null ||
    Boolean(filters.league);

  const toggleBookmaker = (bm: Bookmaker) => {
    const next = filters.bookmakers.includes(bm)
      ? filters.bookmakers.filter((b) => b !== bm)
      : [...filters.bookmakers, bm];
    onFilterChange({ ...filters, bookmakers: next });
  };

  const toggleResult = (res: string) => {
    const next = filters.results.includes(res)
      ? filters.results.filter((r) => r !== res)
      : [...filters.results, res];
    onFilterChange({ ...filters, results: next });
  };

  const toggleJackpot = (jackpot: string) => {
    const next = filters.jackpots.includes(jackpot)
      ? filters.jackpots.filter((j) => j !== jackpot)
      : [...filters.jackpots, jackpot];
    onFilterChange({ ...filters, jackpots: next });
  };

  // Distinct jackpots list
  const availableJackpots = Array.from(new Set(DATASETS.map((d) => d.jackpot)));

  return (
    <div className="bg-card/70 border-b border-border p-3 lg:px-6 space-y-3">
      {/* Row 1: Search & Primary Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          {isDebouncing ? (
            <Loader2 className="absolute left-3 top-2.5 h-4 w-4 text-primary animate-spin" />
          ) : (
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          )}
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search teams, leagues, jackpots, bookmaker... (⌘K or /)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-background border border-border rounded-md pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Bookmaker Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Bookmaker:</span>
          {(["betika", "mozzart", "sportpesa"] as Bookmaker[]).map((bm) => {
            const isSelected = filters.bookmakers.includes(bm);
            return (
              <button
                key={bm}
                onClick={() => toggleBookmaker(bm)}
                className={`text-xs px-2.5 py-1.5 rounded-md border font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary/20 border-primary text-primary shadow-sm"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                }`}
              >
                {bm.charAt(0).toUpperCase() + bm.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Result Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Result:</span>
          {[
            { id: "home", label: "Home", color: "hover:border-emerald-700 text-emerald-400" },
            { id: "draw", label: "Draw", color: "hover:border-amber-700 text-amber-400" },
            { id: "away", label: "Away", color: "hover:border-sky-700 text-sky-400" },
            { id: "postponed", label: "Postp", color: "hover:border-purple-700 text-purple-400" },
          ].map((res) => {
            const isSelected = filters.results.includes(res.id);
            return (
              <button
                key={res.id}
                onClick={() => toggleResult(res.id)}
                className={`text-xs px-2.5 py-1.5 rounded-md border font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-secondary border-border text-foreground shadow-sm ring-1 ring-ring/40"
                    : `bg-background border-border text-muted-foreground ${res.color}`
                }`}
              >
                {res.label}
              </button>
            );
          })}
        </div>

        {/* Jackpot Dropdown */}
        <div className="relative" ref={jackpotRef}>
          <button
            onClick={() => setJackpotMenuOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border font-medium transition-colors cursor-pointer ${
              filters.jackpots.length > 0
                ? "bg-primary/20 border-primary text-primary"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Filter className="h-3 w-3" />
            <span>
              {filters.jackpots.length > 0
                ? `${filters.jackpots.length} Jackpot${filters.jackpots.length > 1 ? "s" : ""}`
                : "Jackpots"}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>

          {jackpotMenuOpen && (
            <div className="absolute right-0 mt-1 w-60 max-h-72 overflow-y-auto rounded-md bg-popover border border-border shadow-xl z-50 p-1.5 text-xs animate-in fade-in duration-100 text-popover-foreground">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border mb-1">
                Select Jackpots
              </div>
              {availableJackpots.map((jackpot) => {
                const checked = filters.jackpots.includes(jackpot);
                return (
                  <label
                    key={jackpot}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-popover-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleJackpot(jackpot)}
                      className="rounded border-border bg-background text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>{jackpot}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Toggle Advanced Filters Button */}
        <Button
          variant={showAdvanced ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="gap-1.5 text-xs"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Filters</span>
        </Button>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Row 2: Advanced filters (Date range, Odds range, League) */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60 text-xs">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Date:</span>
            <input
              type="date"
              value={filters.from || ""}
              onChange={(e) => onFilterChange({ ...filters, from: e.target.value || null })}
              className="bg-background border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={filters.to || ""}
              onChange={(e) => onFilterChange({ ...filters, to: e.target.value || null })}
              className="bg-background border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Odds Range */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Odds:</span>
            <input
              type="number"
              step="0.05"
              placeholder="Min"
              value={filters.minOdds ?? ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  minOdds: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-16 bg-background border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="number"
              step="0.05"
              placeholder="Max"
              value={filters.maxOdds ?? ""}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  maxOdds: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-16 bg-background border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* League Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">League:</span>
            <select
              value={filters.league || ""}
              onChange={(e) => onFilterChange({ ...filters, league: e.target.value || null })}
              className="bg-background border border-border rounded px-2 py-1 text-foreground max-w-[220px] focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">All Leagues</option>
              {uniqueLeagues.slice(0, 100).map((league) => (
                <option key={league} value={league}>
                  {league}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
