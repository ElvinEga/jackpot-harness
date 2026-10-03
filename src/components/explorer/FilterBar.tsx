import React, { useEffect, useRef, useState, useMemo } from "react";
import { Search, X, RotateCcw, Filter, ChevronDown, SlidersHorizontal, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import type { MatchFilters, Bookmaker } from "../../lib/types";
import { DATASETS } from "../../lib/data";

const BOOKMAKER_LABELS: Record<Bookmaker, string> = {
  betika: "Betika",
  mozzart: "Mozzart",
  sportpesa: "SportPesa",
};

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
  const [leagueOpen, setLeagueOpen] = useState(false);

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

  // Helper to parse ISO date "YYYY-MM-DD"
  const parseIsoDate = (iso: string | null): Date | undefined => {
    if (!iso) return undefined;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
  };

  const selectedDateRange: DateRange | undefined = useMemo(() => {
    if (!filters.from && !filters.to) return undefined;
    return {
      from: parseIsoDate(filters.from),
      to: parseIsoDate(filters.to),
    };
  }, [filters.from, filters.to]);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    const fromStr = range?.from ? format(range.from, "yyyy-MM-dd") : null;
    const toStr = range?.to ? format(range.to, "yyyy-MM-dd") : null;
    onFilterChange({
      ...filters,
      from: fromStr,
      to: toStr,
    });
  };

  const dateRangeLabel = useMemo(() => {
    if (filters.from && filters.to) {
      const fromDate = parseIsoDate(filters.from);
      const toDate = parseIsoDate(filters.to);
      if (fromDate && toDate) {
        return `${format(fromDate, "MMM d, yyyy")} – ${format(toDate, "MMM d, yyyy")}`;
      }
      return `${filters.from} – ${filters.to}`;
    }
    if (filters.from) {
      const fromDate = parseIsoDate(filters.from);
      return fromDate ? `From ${format(fromDate, "MMM d, yyyy")}` : `From ${filters.from}`;
    }
    if (filters.to) {
      const toDate = parseIsoDate(filters.to);
      return toDate ? `Until ${format(toDate, "MMM d, yyyy")}` : `Until ${filters.to}`;
    }
    return "Dates";
  }, [filters.from, filters.to]);

  const setYearPreset = (year: number) => {
    onFilterChange({
      ...filters,
      from: `${year}-01-01`,
      to: `${year}-12-31`,
    });
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

  const [leagueQuery, setLeagueQuery] = useState("");
  const visibleLeagues = useMemo(() => {
    const q = leagueQuery.trim().toLowerCase();
    return q ? uniqueLeagues.filter((l) => l.toLowerCase().includes(q)) : uniqueLeagues;
  }, [leagueQuery, uniqueLeagues]);

  return (
    <div className="bg-card/70 border-b border-border p-3 lg:px-6 space-y-3">
      {/* Row 1: Search & Primary Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0 sm:min-w-[280px]">
          {isDebouncing ? (
            <Loader2 className="absolute left-3 top-2.5 h-4 w-4 text-primary animate-spin" />
          ) : (
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search teams, jackpots, bookmakers... (⌘K or /)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9 pr-9"
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
                aria-pressed={isSelected}
                className={`text-xs px-2.5 py-1.5 rounded-md border font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-primary/20 border-primary text-primary shadow-sm"
                    : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                }`}
              >
                {BOOKMAKER_LABELS[bm]}
              </button>
            );
          })}
        </div>

        {/* Result Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Result:</span>
          {[
            { id: "home", label: "Home", color: "hover:border-primary/50 text-primary" },
            { id: "draw", label: "Draw", color: "hover:border-border text-foreground" },
            { id: "away", label: "Away", color: "hover:border-border text-muted-foreground" },
            { id: "postponed", label: "Postp", color: "hover:border-border text-muted-foreground" },
          ].map((res) => {
            const isSelected = filters.results.includes(res.id);
            return (
              <button
                key={res.id}
                onClick={() => toggleResult(res.id)}
                aria-pressed={isSelected}
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

        {/* Jackpot Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <button
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
            }
          />
          <PopoverContent align="end" className="w-64 max-h-72 overflow-y-auto p-2">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
              Select Jackpots
            </div>
            {availableJackpots.map((jackpot) => {
              const checked = filters.jackpots.includes(jackpot);
              return (
                <label
                  key={jackpot}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-popover-foreground text-xs select-none"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleJackpot(jackpot)}
                  />
                  <span>{jackpot}</span>
                </label>
              );
            })}
          </PopoverContent>
        </Popover>

        {/* Date Filter Popover */}
        <Popover>
          <PopoverTrigger
            render={
              <button
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border font-medium transition-colors cursor-pointer ${
                  filters.from || filters.to
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                <span>{dateRangeLabel}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            }
          />
          <PopoverContent align="end" className="w-auto p-3">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border gap-3">
              <span className="text-xs font-semibold text-foreground">Filter by Date Range</span>
              {(filters.from || filters.to) && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onFilterChange({ ...filters, from: null, to: null })}
                  className="text-xs text-destructive hover:text-destructive h-6 px-2"
                >
                  Clear dates
                </Button>
              )}
            </div>

            {/* Quick Year Presets */}
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Presets:</span>
              {[2026, 2025, 2024, 2023, 2022].map((yr) => {
                const isActive = filters.from === `${yr}-01-01` && filters.to === `${yr}-12-31`;
                return (
                  <Button
                    key={yr}
                    variant={isActive ? "secondary" : "outline"}
                    size="xs"
                    onClick={() => setYearPreset(yr)}
                    className="h-7 text-xs px-2.5"
                  >
                    {yr}
                  </Button>
                );
              })}
            </div>

            <Calendar
              mode="range"
              selected={selectedDateRange}
              onSelect={handleDateRangeSelect}
              defaultMonth={selectedDateRange?.from || new Date(2023, 0, 1)}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>

        {/* Toggle Advanced Filters Button */}
        <Button
          variant={showAdvanced ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="gap-1.5 text-xs"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <span>More filters</span>
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

      {/* Row 2: Advanced filters (Odds range, League, Date info) */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60 text-xs">
          {/* Active Date Info */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Active Date:</span>
            {filters.from || filters.to ? (
              <div className="flex items-center gap-1.5 bg-muted border border-border px-2 py-0.5 rounded text-foreground font-mono text-xs">
                <span>{dateRangeLabel}</span>
                <button
                  onClick={() => onFilterChange({ ...filters, from: null, to: null })}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <span className="text-muted-foreground italic">All historical records</span>
            )}
          </div>

          {/* Odds Range */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Odds:</span>
            <Input
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
              className="w-20 h-8 text-xs"
            />
            <span className="text-muted-foreground">-</span>
            <Input
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
              className="w-20 h-8 text-xs"
            />
          </div>

          {/* League Searchable Filter */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">League:</span>
            <Popover open={leagueOpen} onOpenChange={setLeagueOpen}>
              <PopoverTrigger
                render={
                  <button
                    className={`flex items-center gap-1.5 max-w-[240px] text-xs px-3 py-2 rounded-md border font-medium transition-colors cursor-pointer ${
                      filters.league
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="truncate">
                      {filters.league || `All leagues (${uniqueLeagues.length})`}
                    </span>
                    <ChevronDown className="h-3 w-3 shrink-0 opacity-70" />
                  </button>
                }
              />
              <PopoverContent align="start" className="w-72 p-2">
                <div className="relative mb-1.5">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    autoFocus
                    type="text"
                    placeholder="Search leagues..."
                    value={leagueQuery}
                    onChange={(e) => setLeagueQuery(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                {filters.league && (
                  <button
                    onClick={() => {
                      onFilterChange({ ...filters, league: null });
                      setLeagueOpen(false);
                    }}
                    className="w-full text-left text-xs px-2 py-1.5 rounded mb-1 text-destructive hover:bg-destructive/10 cursor-pointer font-medium"
                  >
                    Clear league
                  </button>
                )}
                <div className="max-h-56 overflow-y-auto">
                  {visibleLeagues.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      No league matches “{leagueQuery.trim()}”
                    </p>
                  ) : (
                    visibleLeagues.map((league) => (
                      <button
                        key={league}
                        onClick={() => {
                          onFilterChange({ ...filters, league });
                          setLeagueOpen(false);
                        }}
                        className={`w-full truncate text-left text-xs px-2 py-1.5 rounded cursor-pointer transition-colors hover:bg-muted ${
                          league === filters.league ? "bg-muted font-semibold text-foreground" : "text-popover-foreground"
                        }`}
                      >
                        {league}
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
};
