import React, { useState, useMemo } from "react";
import {
  Trophy,
  Shield,
  Sparkles,
  TrendingUp,
  FlaskConical,
  Table as TableIcon,
  Loader2,
  AlertCircle,
  Calendar,
  Globe,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import { useSeasonMatches, useSeasonIndex } from "../../hooks/useSeasonMatches";
import { SeasonOverview } from "./SeasonOverview";
import { SeasonTeamAnalysis } from "./SeasonTeamAnalysis";
import { SeasonMatchPredictor } from "./SeasonMatchPredictor";
import { SeasonTrends } from "./SeasonTrends";
import { SeasonBacktestView } from "./SeasonBacktestView";
import { SeasonFixturesTable } from "./SeasonFixturesTable";

export type SeasonsSubTab =
  | "overview"
  | "teams"
  | "predictor"
  | "trends"
  | "backtest"
  | "fixtures";

export const SeasonsDashboard: React.FC = () => {
  const { data: allMatches = [], isLoading, error, refetch } = useSeasonMatches("premier_league");
  const { data: seasonIndex } = useSeasonIndex("premier_league");

  const [activeSeason, setActiveSeason] = useState<string>("2025-2026");
  const [activeSubTab, setActiveSubTab] = useState<SeasonsSubTab>("overview");
  const [selectedTeam, setSelectedTeam] = useState<string>("Arsenal");
  const [predHome, setPredHome] = useState<string>("Liverpool");
  const [predAway, setPredAway] = useState<string>("Arsenal");

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

  // Filter matches based on selected season
  const seasonFilteredMatches = useMemo(() => {
    if (activeSeason === "all") return allMatches;
    return allMatches.filter((m) => m.season === activeSeason);
  }, [allMatches, activeSeason]);

  const handleSelectTeamFromStandings = (team: string) => {
    setSelectedTeam(team);
    setActiveSubTab("teams");
  };

  const handlePredictMatchup = (home: string, away: string) => {
    setPredHome(home);
    setPredAway(away);
    setActiveSubTab("predictor");
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

        {/* Season Selector */}
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
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center justify-start border-b border-border pb-px overflow-x-auto">
        <Tabs value={activeSubTab} onValueChange={(val) => setActiveSubTab(val as SeasonsSubTab)}>
          <TabsList className="h-9 bg-muted/40 p-1">
            <TabsTrigger value="overview" className="text-xs gap-1.5 h-7">
              <Trophy className="h-3.5 w-3.5" />
              <span>Standings &amp; Overview</span>
            </TabsTrigger>

            <TabsTrigger value="teams" className="text-xs gap-1.5 h-7">
              <Shield className="h-3.5 w-3.5" />
              <span>Team Deep Dive</span>
            </TabsTrigger>

            <TabsTrigger value="predictor" className="text-xs gap-1.5 h-7">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Match Predictor</span>
            </TabsTrigger>

            <TabsTrigger value="trends" className="text-xs gap-1.5 h-7">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Trends &amp; Calendar</span>
            </TabsTrigger>

            <TabsTrigger value="backtest" className="text-xs gap-1.5 h-7">
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Model Backtest</span>
            </TabsTrigger>

            <TabsTrigger value="fixtures" className="text-xs gap-1.5 h-7">
              <TableIcon className="h-3.5 w-3.5" />
              <span>Fixtures &amp; Odds</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Active Tab Content Area */}
      {activeSubTab === "overview" && (
        <SeasonOverview
          matches={seasonFilteredMatches}
          seasonName={activeSeason === "all" ? "All Seasons (2021–2027)" : `Season ${activeSeason}`}
          onSelectTeam={handleSelectTeamFromStandings}
        />
      )}

      {activeSubTab === "teams" && (
        <SeasonTeamAnalysis
          matches={seasonFilteredMatches}
          seasonName={activeSeason === "all" ? "All Seasons" : `Season ${activeSeason}`}
          selectedTeam={selectedTeam}
          onSelectTeam={setSelectedTeam}
          onPredictWithTeam={handlePredictMatchup}
        />
      )}

      {activeSubTab === "predictor" && (
        <SeasonMatchPredictor
          matches={allMatches}
          defaultHomeTeam={predHome}
          defaultAwayTeam={predAway}
        />
      )}

      {activeSubTab === "trends" && <SeasonTrends allMatches={allMatches} />}

      {activeSubTab === "backtest" && <SeasonBacktestView allMatches={allMatches} />}

      {activeSubTab === "fixtures" && (
        <SeasonFixturesTable
          matches={seasonFilteredMatches}
          onSelectTeamForAnalysis={handleSelectTeamFromStandings}
        />
      )}
    </div>
  );
};
