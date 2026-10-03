import React, { useEffect, useRef, useState } from "react";
import { Search, X, RotateCcw, Filter, ChevronDown, SlidersHorizontal } from "lucide-react";
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
    <div className="bg-slate-900/90 border-b border-slate-800 p-3 lg:px-6 space-y-3">
      {/* Row 1: Search & Primary Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search teams, leagues, jackpots, bookmaker... (⌘K or /)"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-9 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: "" })}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Bookmaker Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Bookmaker:</span>
          {(["betika", "mozzart", "sportpesa"] as Bookmaker[]).map((bm) => {
            const isSelected = filters.bookmakers.includes(bm);
            return (
              <button
                key={bm}
                onClick={() => toggleBookmaker(bm)}
                className={`text-xs px-2.5 py-1.5 rounded-md border font-medium transition-colors ${
                  isSelected
                    ? "bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {bm.charAt(0).toUpperCase() + bm.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Result Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Result:</span>
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
                className={`text-xs px-2.5 py-1.5 rounded-md border font-medium transition-colors ${
                  isSelected
                    ? "bg-slate-800 border-slate-600 text-white shadow-sm ring-1 ring-slate-500"
                    : `bg-slate-950 border-slate-800 text-slate-400 ${res.color}`
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
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-md border font-medium transition-colors ${
              filters.jackpots.length > 0
                ? "bg-blue-600/20 border-blue-500 text-blue-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Filter className="h-3 w-3" />
            <span>
              {filters.jackpots.length > 0
                ? `${filters.jackpots.length} Jackpot${filters.jackpots.length > 1 ? "s" : ""}`
                : "Jackpots"}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {jackpotMenuOpen && (
            <div className="absolute right-0 mt-1 w-60 max-h-72 overflow-y-auto rounded-md bg-slate-900 border border-slate-800 shadow-xl z-50 p-1.5 text-xs animate-in fade-in duration-100">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800 mb-1">
                Select Jackpots
              </div>
              {availableJackpots.map((jackpot) => {
                const checked = filters.jackpots.includes(jackpot);
                return (
                  <label
                    key={jackpot}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800 cursor-pointer text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleJackpot(jackpot)}
                      className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
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
          className="gap-1.5 text-xs bg-slate-950 border-slate-800"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <span>Filters</span>
        </Button>

        {/* Reset Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="gap-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Row 2: Advanced filters (Date range, Odds range, League) */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-xs">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Date:</span>
            <input
              type="date"
              value={filters.from || ""}
              onChange={(e) => onFilterChange({ ...filters, from: e.target.value || null })}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={filters.to || ""}
              onChange={(e) => onFilterChange({ ...filters, to: e.target.value || null })}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Odds Range */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Odds:</span>
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
              className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-slate-500">-</span>
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
              className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* League Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">League:</span>
            <select
              value={filters.league || ""}
              onChange={(e) => onFilterChange({ ...filters, league: e.target.value || null })}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 max-w-[220px] focus:outline-none focus:ring-1 focus:ring-blue-500"
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
