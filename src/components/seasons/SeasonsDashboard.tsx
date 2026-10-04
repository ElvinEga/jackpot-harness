import React, { useState, useMemo } from "react";
import {
  Trophy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import type { SeasonMatch } from "../../lib/seasonTypes";
import { useSeasonMatches, useSeasonIndex } from "../../hooks/useSeasonMatches";
import { SeasonOverview } from "./SeasonOverview";
import { SeasonTeamAnalysis } from "./SeasonTeamAnalysis";
import { SeasonMatchPredictor } from "./SeasonMatchPredictor";
import { SeasonTrends } from "./SeasonTrends";
import { SeasonBacktestView } from "./SeasonBacktestView";
import { SeasonFixturesTable } from "./SeasonFixturesTable";
import { SeasonDataTable } from "./SeasonDataTable";
import { SeasonFilterBar, type SeasonFiltersState } from "./SeasonFilterBar";
import { SeasonMatchDetailSheet } from "./SeasonMatchDetailSheet";
import type { SeasonsTab } from "../layout/Header";

export type { SeasonsTab } from "../layout/Header";

interface SeasonsDashboardProps {
  activeTab?: SeasonsTab;
  onTabChange?: (tab: SeasonsTab) => void;
}

export const SeasonsDashboard: React.FC<SeasonsDashboardProps> = ({
  activeTab: controlledTab,
  onTabChange: setControlledTab,
}) => {
  const { data: allMatches = [], isLoading, error, refetch } = useSeasonMatches("premier_league");
  const { data: seasonIndex } = useSeasonIndex("premier_league");

  const [activeSeason, setActiveSeason] = useState<string>("2025-2026");
  const [internalTab, setInternalTab] = useState<SeasonsTab>("explorer");
  const rawTab = controlledTab ?? internalTab;
  const currentTab =
    rawTab === "overview"
      ? "standings"
      : rawTab === "teams"
      ? "deepdive"
      : rawTab;

  const setCurrentTab = (tab: SeasonsTab) => {
    if (setControlledTab) {
      setControlledTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const [selectedTeam, setSelectedTeam] = useState<string>("Arsenal");
  const [predHome, setPredHome] = useState<string>("Liverpool");
  const [predAway, setPredAway] = useState<string>("Arsenal");

  // Explorer state
  const [selectedDetailMatch, setSelectedDetailMatch] = useState<SeasonMatch | null>(null);
  const [explorerFilters, setExplorerFilters] = useState<SeasonFiltersState>({
    search: "",
    season: "all",
    team: "all",
    result: "all",
    goals: "all",
  });

  // Extract distinct available seasons from index or matches
  const availableSeasons = useMemo(() => {
    if (seasonIndex?.seasons) {
      return [...seasonIndex.seasons].map((s) => s.season).sort().reverse();
    }
    const set = new Set<string>();
    for (const m of allMatches) {
      if (m.season) set.add(m.season);
    }
    return Array.from(set).sort().reverse();
  }, [seasonIndex, allMatches]);

  // Set default season to the most complete or current season once loaded
  useMemo(() => {
    if (availableSeasons.length > 0 && !availableSeasons.includes(activeSeason) && activeSeason !== "all") {
      setActiveSeason(availableSeasons[0]);
    }
  }, [availableSeasons, activeSeason]);

  // Filter matches based on selected season (for overview, teams, fixtures)
  const seasonFilteredMatches = useMemo(() => {
    if (activeSeason === "all") return allMatches;
    return allMatches.filter((m) => m.season === activeSeason);
  }, [allMatches, activeSeason]);

  // Teams available across all seasons
  const availableTeams = useMemo(() => {
    const set = new Set<string>();
    for (const m of allMatches) {
      if (m.home_team) set.add(m.home_team);
      if (m.away_team) set.add(m.away_team);
    }
    return Array.from(set).sort();
  }, [allMatches]);

  // Explorer filtered matches
  const explorerFilteredMatches = useMemo(() => {
    let res = allMatches;

    if (explorerFilters.season !== "all") {
      res = res.filter((m) => m.season === explorerFilters.season);
    }

    if (explorerFilters.team !== "all") {
      res = res.filter(
        (m) =>
          m.home_team === explorerFilters.team ||
          m.away_team === explorerFilters.team
      );
    }

    if (explorerFilters.result !== "all") {
      res = res.filter((m) => m.result === explorerFilters.result);
    }

    if (explorerFilters.goals !== "all") {
      if (explorerFilters.goals === "over25") {
        res = res.filter((m) => (m.total_goals ?? 0) > 2.5);
      } else if (explorerFilters.goals === "under25") {
        res = res.filter((m) => (m.total_goals ?? 0) < 2.5);
      } else if (explorerFilters.goals === "btts") {
        res = res.filter(
          (m) => (m.home_goals ?? 0) > 0 && (m.away_goals ?? 0) > 0
        );
      }
    }

    if (explorerFilters.search.trim()) {
      const q = explorerFilters.search.toLowerCase();
      res = res.filter(
        (m) =>
          m.home_team.toLowerCase().includes(q) ||
          m.away_team.toLowerCase().includes(q) ||
          (m.referee && m.referee.toLowerCase().includes(q)) ||
          (m.score && m.score.toLowerCase().includes(q))
      );
    }

    return res;
  }, [allMatches, explorerFilters]);

  const handleSelectTeamFromStandings = (team: string) => {
    setSelectedTeam(team);
    setCurrentTab("deepdive");
  };

  const handlePredictMatchup = (home: string, away: string) => {
    setPredHome(home);
    setPredAway(away);
    setCurrentTab("predictor");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
        <h3 className="text-sm font-bold text-foreground">Loading Premier League Seasons Data</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Ingesting multi-season fixture stats (2021–2027) with shots, corners, cards, and bookmaker odds...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <h3 className="text-sm font-bold text-foreground">Failed to load seasons data</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          {error instanceof Error ? error.message : "Network error"}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner & Season Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Trophy className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Premier League Seasons Intelligence
            </h1>
            <Badge variant="outline" className="text-xs font-mono font-bold text-primary border-primary/30">
              6 Seasons (1,950 Matches)
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Deep analysis across 132-column Football-Data fixtures: Expected goals (xG), Poisson matrices, team ratings, and walk-forward backtests.
          </p>
        </div>

        {/* Season Selector (used by Overview, Teams, Fixtures) */}
        {currentTab !== "explorer" && (
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-medium text-muted-foreground">Select Season:</label>
            <NativeSelect
              value={activeSeason}
              onChange={(e) => setActiveSeason(e.target.value)}
              className="text-xs font-semibold h-8 min-w-40"
            >
              <NativeSelectOption value="all">All Seasons Combined (2021–2027)</NativeSelectOption>
              {availableSeasons.map((s) => (
                <NativeSelectOption key={s} value={s}>
                  Season {s}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        )}
      </div>

      {/* Active Tab Content Area */}
      {currentTab === "explorer" && (
        <div className="space-y-4">
          <SeasonFilterBar
            filters={explorerFilters}
            onFilterChange={setExplorerFilters}
            onReset={() =>
              setExplorerFilters({
                search: "",
                season: "all",
                team: "all",
                result: "all",
                goals: "all",
              })
            }
            availableSeasons={availableSeasons}
            availableTeams={availableTeams}
            filteredCount={explorerFilteredMatches.length}
            totalCount={allMatches.length}
          />
          <SeasonDataTable
            matches={explorerFilteredMatches}
            allMatches={allMatches}
            onSelectMatch={(m) => setSelectedDetailMatch(m)}
            onNavigateToPredictor={handlePredictMatchup}
            onNavigateToTeam={handleSelectTeamFromStandings}
          />
        </div>
      )}

      {currentTab === "standings" && (
        <SeasonOverview
          matches={seasonFilteredMatches}
          seasonName={activeSeason === "all" ? "All Seasons (2021–2027)" : `Season ${activeSeason}`}
          onSelectTeam={handleSelectTeamFromStandings}
        />
      )}

      {currentTab === "deepdive" && (
        <SeasonTeamAnalysis
          matches={seasonFilteredMatches}
          seasonName={activeSeason === "all" ? "All Seasons" : `Season ${activeSeason}`}
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
          onPredictWithTeam={handlePredictMatchup}
        />
      )}

      {currentTab === "predictor" && (
        <SeasonMatchPredictor
          matches={allMatches}
          defaultHomeTeam={predHome}
          defaultAwayTeam={predAway}
        />
      )}

      {currentTab === "trends" && <SeasonTrends allMatches={allMatches} />}

      {currentTab === "backtest" && <SeasonBacktestView allMatches={allMatches} />}

      {currentTab === "fixtures" && (
        <SeasonFixturesTable
          matches={seasonFilteredMatches}
          onSelectTeamForAnalysis={handleSelectTeamFromStandings}
        />
      )}

      {/* Full 132-column stats and odds detail sheet */}
      <SeasonMatchDetailSheet
        match={selectedDetailMatch}
        onClose={() => setSelectedDetailMatch(null)}
        onSelectTeamForAnalysis={handleSelectTeamFromStandings}
        onPredictMatchup={handlePredictMatchup}
      />
    </div>
  );
};
