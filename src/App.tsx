import React, { useState, useMemo, useDeferredValue } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Header, type AppTab, type AppMode, type SeasonsTab } from "./components/layout/Header";
import { FilterBar } from "./components/explorer/FilterBar";
import { DataTable } from "./components/explorer/DataTable";
import { MatchDetailSheet } from "./components/explorer/MatchDetailSheet";
import { JackpotPredictor } from "./components/predictor/JackpotPredictor";
import { Toaster } from "./components/ui/toast";
import { PositionMatrix } from "./components/positions/PositionMatrix";
import { TeamVersusTeam } from "./components/teams/TeamVersusTeam";
import { GoalAnalysisView } from "./components/goals/GoalAnalysisView";
import { SeasonsDashboard } from "./components/seasons/SeasonsDashboard";
import { Button } from "./components/ui/button";

import type { Match, AppStats, MatchFilters } from "./lib/types";
import { computeDatasetStats } from "./lib/data";
import { filterMatches } from "./lib/filters";
import { useUrlFilters } from "./hooks/useUrlFilters";
import { useJackpotMatches } from "./hooks/useJackpotMatches";

export function App() {
  const { data: matches = [], isLoading: loading, error, refetch } = useJackpotMatches();

  const [appMode, setAppMode] = useState<AppMode>("jackpot");
  const [activeTab, setActiveTab] = useState<AppTab>("explorer");
  const [seasonsTab, setSeasonsTab] = useState<SeasonsTab>("explorer");
  const [seasonsCompetition, setSeasonsCompetition] = useState<string>("premier_league");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Teams to pre-fill when transferring from Predictor to H2H view
  const [h2hTeamA, setH2hTeamA] = useState<string>("Arsenal");
  const [h2hTeamB, setH2hTeamB] = useState<string>("Chelsea");

  const { filters, setFilters, resetFilters } = useUrlFilters();
  const deferredFilters = useDeferredValue(filters);
  const isFiltering = filters !== deferredFilters;

  // Compute overall dataset stats
  const datasetStats: AppStats | null = useMemo(() => {
    if (matches.length === 0) return null;
    return computeDatasetStats(matches);
  }, [matches]);

  // Extract unique sorted leagues for dropdown
  const uniqueLeagues = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) {
      if (m.league) set.add(m.league);
    }
    return Array.from(set).sort();
  }, [matches]);

  // Filter matches based on current active filters with non-blocking deferred computation
  const filteredMatches = useMemo(() => {
    return filterMatches(matches, deferredFilters);
  }, [matches, deferredFilters]);

  const handleApplyPartialFilter = (partial: Partial<MatchFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleOpenH2H = (teamA: string, teamB: string) => {
    setH2hTeamA(teamA);
    setH2hTeamB(teamB);
    setActiveTab("teams");
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm p-6 rounded-2xl bg-card border border-border shadow-2xl flex flex-col items-center space-y-4 text-card-foreground">
          <img src="/logo.png" alt="Football Jackpot Harness" className="h-14 w-14 rounded-xl" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading Jackpot Archives
            </h2>
            <p className="text-xs text-muted-foreground">
              Retrieving historical match records across Betika, Mozzart, and SportPesa...
            </p>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-full w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md p-6 rounded-xl bg-card border border-destructive/50 flex flex-col items-center space-y-4 text-card-foreground">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">Failed to load datasets</h2>
            <p className="text-xs text-muted-foreground">{error instanceof Error ? error.message : "Network error"}</p>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => refetch()}
          >
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Toaster>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header */}
      <Header
        stats={datasetStats}
        filteredCount={filteredMatches.length}
        totalCount={matches.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        seasonsTab={seasonsTab}
        onSeasonsTabChange={setSeasonsTab}
        filteredMatches={filteredMatches}
        isFiltering={isFiltering}
        appMode={appMode}
        onModeChange={setAppMode}
      />

      {/* Main Content Area */}
      {appMode === "seasons" ? (
        <SeasonsDashboard
          activeTab={seasonsTab}
          onTabChange={setSeasonsTab}
          competition={seasonsCompetition}
          onCompetitionChange={setSeasonsCompetition}
        />
      ) : (
        <>
          {activeTab === "predictor" && (
            <JackpotPredictor matches={matches} onSelectTeamForH2H={handleOpenH2H} />
          )}

          {activeTab === "positions" && (
            <PositionMatrix matches={matches} />
          )}

          {activeTab === "teams" && (
            <TeamVersusTeam
              matches={matches}
              initialTeamA={h2hTeamA}
              initialTeamB={h2hTeamB}
            />
          )}

          {activeTab === "goals" && (
            <GoalAnalysisView matches={matches} />
          )}

          {activeTab === "explorer" && (
            <div className="flex-1 flex flex-col min-h-0">
              <FilterBar
                filters={filters}
                onFilterChange={setFilters}
                onReset={resetFilters}
                uniqueLeagues={uniqueLeagues}
              />
              <DataTable
                matches={filteredMatches}
                allMatches={matches}
                onSelectMatch={setSelectedMatch}
                onNavigateToH2H={handleOpenH2H}
              />
            </div>
          )}

          {/* Match Detail Drawer / Sheet */}
          <MatchDetailSheet
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            onApplyFilter={handleApplyPartialFilter}
          />
        </>
      )}
      </div>
    </Toaster>
  );
}

export default App;
