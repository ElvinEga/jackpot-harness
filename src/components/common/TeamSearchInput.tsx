import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface TeamSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  teams?: string[];
  teamAppearances?: Map<string, number>;
  placeholder?: string;
  className?: string;
  size?: "default" | "sm" | "xs";
  disabled?: boolean;
}

export const TeamSearchInput: React.FC<TeamSearchInputProps> = ({
  value,
  onChange,
  teams = [],
  teamAppearances,
  placeholder = "Search or enter team...",
  className = "",
  size = "default",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered & ranked suggestions
  const suggestions = useMemo(() => {
    const q = (value || "").trim().toLowerCase();

    if (!q) {
      // If empty query, show top popular teams by appearance count
      if (teamAppearances) {
        return Array.from(teamAppearances.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([team]) => team);
      }
      return teams.slice(0, 20);
    }

    // Match teams containing the query
    const matched = teams.filter((t) => t.toLowerCase().includes(q));

    // Sort: 1) startsWith first, 2) appearance count if available, 3) alphabetical
    return matched
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(q);
        const bStarts = b.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        if (teamAppearances) {
          const aCount = teamAppearances.get(a) || 0;
          const bCount = teamAppearances.get(b) || 0;
          if (aCount !== bCount) return bCount - aCount;
        }

        return a.localeCompare(b);
      })
      .slice(0, 25);
  }, [value, teams, teamAppearances]);

  // Reset highlight index when suggestions change
  useEffect(() => {
    setHighlightIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightIndex]);

  const handleSelectTeam = (team: string) => {
    onChange(team);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (isOpen && highlightIndex >= 0 && suggestions[highlightIndex]) {
        e.preventDefault();
        handleSelectTeam(suggestions[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Helper to highlight matching characters
  const renderHighlightedTeam = (teamName: string) => {
    const q = (value || "").trim().toLowerCase();
    if (!q) return <span>{teamName}</span>;

    const idx = teamName.toLowerCase().indexOf(q);
    if (idx === -1) return <span>{teamName}</span>;

    const before = teamName.slice(0, idx);
    const match = teamName.slice(idx, idx + q.length);
    const after = teamName.slice(idx + q.length);

    return (
      <span>
        {before}
        <strong className="text-primary font-bold underline decoration-primary/40">{match}</strong>
        {after}
      </span>
    );
  };

  const inputHeight = size === "xs" ? "h-7 text-xs" : size === "sm" ? "h-8 text-xs" : "h-9 text-xs";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <Input
          ref={inputRef}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`${inputHeight} font-semibold pr-8 transition-colors`}
        />

        <div className="absolute right-2 flex items-center gap-1 text-muted-foreground">
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
                setIsOpen(true);
              }}
              className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded-sm transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Search className="h-3.5 w-3.5 pointer-events-none opacity-50" />
          )}
        </div>
      </div>

      {/* Autocomplete Popover Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full min-w-[240px] max-w-[min(360px,calc(100vw-2rem))] overflow-y-auto rounded-xl bg-card border border-border shadow-2xl p-1 text-xs outline-none animate-in fade-in-0 zoom-in-95"
        >
          {suggestions.length > 0 ? (
            <>
              <div className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 flex items-center justify-between border-b border-border/50 mb-1">
                <span>{value.trim() ? "Matching Teams" : "Popular Jackpot Teams"}</span>
                <span>{suggestions.length} found</span>
              </div>
              {suggestions.map((team, idx) => {
                const count = teamAppearances?.get(team);
                const isSelected = team.toLowerCase() === value.trim().toLowerCase();
                const isHighlighted = idx === highlightIndex;

                return (
                  <div
                    key={team}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    onClick={() => handleSelectTeam(team)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      isHighlighted
                        ? "bg-accent text-accent-foreground font-semibold"
                        : isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Shield className="h-3 w-3 text-primary/60 shrink-0" />
                      <span className="truncate">{renderHighlightedTeam(team)}</span>
                    </div>

                    {count !== undefined && (
                      <span className="text-xs font-mono text-muted-foreground shrink-0">
                        {count} games
                      </span>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <div className="p-3 text-center text-xs text-muted-foreground">
              <span>No team matching "{value}" found</span>
              <div className="text-xs text-muted-foreground/70 mt-0.5">
                (Press Enter to use this custom team name)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
