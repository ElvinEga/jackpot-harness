import React from "react";
import { Search, RotateCcw, Filter, Trophy, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { AVAILABLE_COMPETITIONS } from "../../lib/seasonsData";

export interface SeasonFiltersState {
  search: string;
  season: string;
  team: string;
  result: "all" | "home" | "draw" | "away";
  goals: "all" | "over25" | "under25" | "btts";
}

interface SeasonFilterBarProps {
  filters: SeasonFiltersState;
  onFilterChange: (filters: SeasonFiltersState) => void;
  onReset: () => void;
  availableSeasons: string[];
  availableTeams: string[];
  filteredCount: number;
  totalCount: number;
  activeCompetition?: string;
  onCompetitionChange?: (competition: string) => void;
}

export const SeasonFilterBar: React.FC<SeasonFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  availableSeasons,
  availableTeams,
  filteredCount,
  totalCount,
  activeCompetition,
  onCompetitionChange,
}) => {
  const isFiltered =
    filters.search !== "" ||
    filters.season !== "all" ||
    filters.team !== "all" ||
    filters.result !== "all" ||
    filters.goals !== "all";

  return (
    <div className="border-b border-border bg-card px-4 py-2.5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-44 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search teams, referee..."
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="pl-8 h-8 text-xs bg-muted/30 border-border"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* League / Competition Filter */}
          {activeCompetition && onCompetitionChange && (
            <NativeSelect
              size="sm"
              value={activeCompetition}
              onChange={(e) => onCompetitionChange(e.target.value)}
              className="w-36 text-xs h-8 font-semibold"
            >
              {AVAILABLE_COMPETITIONS.map((c) => (
                <NativeSelectOption key={c.id} value={c.id}>
                  {c.countryCode === "ESP" ? "🇪🇸" : c.countryCode === "DEU" ? "🇩🇪" : "🏴󠁧󠁢󠁥󠁮󠁧󠁿"} {c.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}

          {/* Season Filter */}
          <NativeSelect
            size="sm"
            value={filters.season}
            onChange={(e) =>
              onFilterChange({ ...filters, season: e.target.value })
            }
            className="w-36 text-xs h-8"
          >
            <NativeSelectOption value="all">All Seasons</NativeSelectOption>
            {availableSeasons.map((s) => (
              <NativeSelectOption key={s} value={s}>
                Season {s}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          {/* Team Filter */}
          <NativeSelect
            size="sm"
            value={filters.team}
            onChange={(e) =>
              onFilterChange({ ...filters, team: e.target.value })
            }
            className="w-36 text-xs h-8"
          >
            <NativeSelectOption value="all">All Teams</NativeSelectOption>
            {availableTeams.map((t) => (
              <NativeSelectOption key={t} value={t}>
                {t}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          {/* Result Filter */}
          <NativeSelect
            size="sm"
            value={filters.result}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                result: e.target.value as SeasonFiltersState["result"],
              })
            }
            className="w-28 text-xs h-8"
          >
            <NativeSelectOption value="all">All Results</NativeSelectOption>
            <NativeSelectOption value="home">Home Win</NativeSelectOption>
            <NativeSelectOption value="draw">Draw</NativeSelectOption>
            <NativeSelectOption value="away">Away Win</NativeSelectOption>
          </NativeSelect>

          {/* Goal Line Filter */}
          <NativeSelect
            size="sm"
            value={filters.goals}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                goals: e.target.value as SeasonFiltersState["goals"],
              })
            }
            className="w-32 text-xs h-8"
          >
            <NativeSelectOption value="all">All Goals</NativeSelectOption>
            <NativeSelectOption value="over25">Over 2.5</NativeSelectOption>
            <NativeSelectOption value="under25">Under 2.5</NativeSelectOption>
            <NativeSelectOption value="btts">BTTS (Both Scored)</NativeSelectOption>
          </NativeSelect>

          {/* Reset Filters Button */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onReset}
              className="text-xs h-8 text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}

          {/* Match Count Badge */}
          <div className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-muted border border-border ml-auto">
            {isFiltered ? (
              <span>
                <strong className="text-primary">{filteredCount.toLocaleString()}</strong> of {totalCount.toLocaleString()}
              </span>
            ) : (
              <span><strong>{totalCount.toLocaleString()}</strong> matches</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
