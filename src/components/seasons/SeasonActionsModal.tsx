import React, { useState, useMemo, useEffect } from "react";
import {
  Swords,
  Sparkles,
  Goal,
  Shield,
  ArrowRightLeft,
  Calendar,
  Activity,
  Trophy,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import type { SeasonMatch } from "../../lib/seasonTypes";
import { getAllSeasonTeams, computeTeamProfile } from "../../lib/seasonsAnalytics";
import { predictSeasonMatch } from "../../lib/seasonsPredictor";

export type SeasonActionType = "h2h" | "prediction" | "goals" | "discipline";

interface SeasonActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: SeasonActionType;
  selectedMatches: SeasonMatch[];
  allMatches: SeasonMatch[];
  onNavigateToPredictor?: (home: string, away: string) => void;
  onNavigateToTeam?: (team: string) => void;
}

export const SeasonActionsModal: React.FC<SeasonActionsModalProps> = ({
  isOpen,
  onClose,
  initialAction = "h2h",
  selectedMatches,
  allMatches,
  onNavigateToPredictor,
  onNavigateToTeam,
}) => {
  const [activeTab, setActiveTab] = useState<SeasonActionType>(initialAction);

  useEffect(() => {
    setActiveTab(initialAction);
  }, [initialAction, isOpen]);

  const allTeams = useMemo(() => getAllSeasonTeams(allMatches), [allMatches]);
  const focusMatch = selectedMatches[0] || null;

  const [teamA, setTeamA] = useState<string>(focusMatch?.home_team || "Arsenal");
  const [teamB, setTeamB] = useState<string>(focusMatch?.away_team || "Chelsea");

  // Sync teams when focusMatch changes
  useEffect(() => {
    if (focusMatch) {
      setTeamA(focusMatch.home_team);
      setTeamB(focusMatch.away_team);
    }
  }, [focusMatch]);

  const handleSwap = () => {
    setTeamA(teamB);
    setTeamB(teamA);
  };

  // Head-to-Head matches between Team A and Team B in all seasons
  const h2hMatches = useMemo(() => {
    return allMatches
      .filter(
        (m) =>
          (m.home_team === teamA && m.away_team === teamB) ||
          (m.home_team === teamB && m.away_team === teamA)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [allMatches, teamA, teamB]);

  // H2H Record aggregation
  const h2hStats = useMemo(() => {
    let winsA = 0;
    let draws = 0;
    let winsB = 0;
    let goalsA = 0;
    let goalsB = 0;
    const scoreCounts = new Map<string, number>();

    for (const m of h2hMatches) {
      const isAHome = m.home_team === teamA;
      const gA = isAHome ? m.home_goals : m.away_goals;
      const gB = isAHome ? m.away_goals : m.home_goals;
      goalsA += gA;
      goalsB += gB;

      scoreCounts.set(m.score, (scoreCounts.get(m.score) || 0) + 1);

      if (gA > gB) winsA++;
      else if (gA === gB) draws++;
      else winsB++;
    }

    const n = h2hMatches.length || 1;
    const topScores = Array.from(scoreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([sc, count]) => ({ score: sc, count }));

    return {
      total: h2hMatches.length,
      winsA,
      draws,
      winsB,
      winRateA: Number(((winsA / n) * 100).toFixed(0)),
      drawRate: Number(((draws / n) * 100).toFixed(0)),
      winRateB: Number(((winsB / n) * 100).toFixed(0)),
      avgGoalsA: Number((goalsA / n).toFixed(2)),
      avgGoalsB: Number((goalsB / n).toFixed(2)),
      totalGoals: goalsA + goalsB,
      topScores,
    };
  }, [h2hMatches, teamA, teamB]);

  // Match Prediction for Team A vs Team B
  const prediction = useMemo(() => {
    return predictSeasonMatch(allMatches, teamA, teamB);
  }, [allMatches, teamA, teamB]);

  // Profiles for Goals & Discipline Tab
  const profileA = useMemo(() => computeTeamProfile(allMatches, teamA), [allMatches, teamA]);
  const profileB = useMemo(() => computeTeamProfile(allMatches, teamB), [allMatches, teamB]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border p-6 max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              Match &amp; Historical Intelligence
            </DialogTitle>
            <Badge variant="outline" className="text-xs font-mono">
              {selectedMatches.length} Row{selectedMatches.length !== 1 ? "s" : ""} Selected
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Historical head-to-head analysis, Poisson goal modeling, and discipline metrics
          </DialogDescription>
        </DialogHeader>

        {/* Team Matchup Selector Bar */}
        <div className="p-3 bg-muted/30 border border-border rounded-xl flex items-center justify-between gap-3 mt-4 shrink-0">
          <div className="flex-1">
            <span className="text-[10px] text-muted-foreground font-semibold block mb-0.5">Team A (Home)</span>
            <NativeSelect
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              className="text-xs font-semibold h-8 w-full"
            >
              {allTeams.map((t) => (
                <NativeSelectOption key={t} value={t} disabled={t === teamB}>
                  {t}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleSwap}
            className="self-end mb-0.5 h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            title="Swap Teams"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </Button>

          <div className="flex-1">
            <span className="text-[10px] text-muted-foreground font-semibold block mb-0.5">Team B (Away)</span>
            <NativeSelect
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              className="text-xs font-semibold h-8 w-full"
            >
              {allTeams.map((t) => (
                <NativeSelectOption key={t} value={t} disabled={t === teamA}>
                  {t}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-3 border-b border-border pb-px shrink-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SeasonActionType)}>
            <TabsList className="h-8 bg-muted/40 p-0.5">
              <TabsTrigger value="h2h" className="text-xs gap-1.5 h-7">
                <Swords className="h-3 w-3" />
                <span>Head-to-Head</span>
              </TabsTrigger>
              <TabsTrigger value="prediction" className="text-xs gap-1.5 h-7">
                <Sparkles className="h-3 w-3" />
                <span>Match xG &amp; Prediction</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="text-xs gap-1.5 h-7">
                <Goal className="h-3 w-3" />
                <span>Goal Distributions</span>
              </TabsTrigger>
              <TabsTrigger value="discipline" className="text-xs gap-1.5 h-7">
                <Shield className="h-3 w-3" />
                <span>Discipline &amp; Cards</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-4 text-xs">
          {/* TAB 1: Head-to-Head */}
          {activeTab === "h2h" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[11px] text-muted-foreground block truncate">{teamA} Wins</span>
                  <span className="text-2xl font-bold font-mono text-emerald-500 block my-0.5">
                    {h2hStats.winsA}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{h2hStats.winRateA}%</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[11px] text-muted-foreground block">Draws</span>
                  <span className="text-2xl font-bold font-mono text-amber-500 block my-0.5">
                    {h2hStats.draws}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{h2hStats.drawRate}%</span>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <span className="text-[11px] text-muted-foreground block truncate">{teamB} Wins</span>
                  <span className="text-2xl font-bold font-mono text-blue-500 block my-0.5">
                    {h2hStats.winsB}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{h2hStats.winRateB}%</span>
                </div>
              </div>

              {/* Goal Averages & Most Frequent Scores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                  <span className="font-semibold text-foreground block">Goal Averages in H2H:</span>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">{teamA} Avg Goals:</span>
                    <span className="font-bold text-foreground">{h2hStats.avgGoalsA}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">{teamB} Avg Goals:</span>
                    <span className="font-bold text-foreground">{h2hStats.avgGoalsB}</span>
                  </div>
                  <div className="flex justify-between font-mono pt-1 border-t border-border">
                    <span className="text-muted-foreground">Total Match Average:</span>
                    <span className="font-bold text-primary">
                      {h2hMatches.length > 0 ? (h2hStats.totalGoals / h2hMatches.length).toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                  <span className="font-semibold text-foreground block">Most Frequent Scores:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {h2hStats.topScores.length > 0 ? (
                      h2hStats.topScores.map((sc) => (
                        <span
                          key={sc.score}
                          className="px-2 py-1 rounded bg-muted border border-border font-mono font-bold text-foreground text-xs"
                        >
                          {sc.score} <span className="text-[10px] text-muted-foreground font-normal">({sc.count}x)</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground">No previous meetings recorded.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Meetings Table */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-3 py-2 bg-muted/40 font-semibold text-foreground text-xs">
                  Recent Meetings History ({h2hMatches.length} Matches)
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs font-mono">
                    <tbody className="divide-y divide-border">
                      {h2hMatches.map((m, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="py-1.5 px-3 text-muted-foreground font-sans">{m.date}</td>
                          <td className="py-1.5 px-3 font-sans">
                            {m.home_team} vs {m.away_team}
                          </td>
                          <td className="py-1.5 px-3 font-bold text-right text-foreground">{m.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Match Prediction */}
          {activeTab === "prediction" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-card border border-border space-y-3 text-center">
                <span className="text-xs text-muted-foreground block">
                  Bivariate Poisson Expected Goals
                </span>
                <div className="flex items-center justify-center gap-6">
                  <div>
                    <span className="font-bold text-base text-foreground block">{teamA}</span>
                    <span className="text-2xl font-bold font-mono text-emerald-500">
                      {prediction.expectedHomeGoals}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs font-mono">xG</span>
                  <div>
                    <span className="font-bold text-base text-foreground block">{teamB}</span>
                    <span className="text-2xl font-bold font-mono text-blue-500">
                      {prediction.expectedAwayGoals}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Home Win Prob</span>
                  <span className="text-lg font-bold text-emerald-500">{prediction.homeProb}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Draw Prob</span>
                  <span className="text-lg font-bold text-amber-500">{prediction.drawProb}%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Away Win Prob</span>
                  <span className="text-lg font-bold text-blue-500">{prediction.awayProb}%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                <span className="font-semibold text-foreground block">Top Likely Scores:</span>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  {prediction.mostLikelyScores.slice(0, 3).map((sc) => (
                    <div key={sc.score} className="p-2 rounded bg-muted/30 border border-border">
                      <span className="font-bold text-xs text-foreground block">{sc.score}</span>
                      <span className="text-[10px] text-primary">{sc.prob}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Goal Distributions */}
          {activeTab === "goals" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                  <span className="font-bold text-foreground block">{teamA} Goals Overview</span>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Scored / Game:</span>
                    <span className="font-semibold">{profileA?.avgGoalsFor ?? "—"}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Conceded / Game:</span>
                    <span className="font-semibold">{profileA?.avgGoalsAgainst ?? "—"}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Clean Sheet Rate:</span>
                    <span className="font-semibold text-emerald-500">{profileA?.cleanSheetPct ?? "—"}%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                  <span className="font-bold text-foreground block">{teamB} Goals Overview</span>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Scored / Game:</span>
                    <span className="font-semibold">{profileB?.avgGoalsFor ?? "—"}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Conceded / Game:</span>
                    <span className="font-semibold">{profileB?.avgGoalsAgainst ?? "—"}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Clean Sheet Rate:</span>
                    <span className="font-semibold text-emerald-500">{profileB?.cleanSheetPct ?? "—"}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Discipline & Cards */}
          {activeTab === "discipline" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                  <span className="font-bold text-foreground block">{teamA} Cards</span>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Yellow Cards / 90:</span>
                    <span className="font-semibold text-amber-500">{profileA?.avgYellows ?? "—"}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Red Cards / 90:</span>
                    <span className="font-semibold text-destructive">{profileA?.avgReds ?? "—"}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-card border border-border space-y-2">
                  <span className="font-bold text-foreground block">{teamB} Cards</span>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Yellow Cards / 90:</span>
                    <span className="font-semibold text-amber-500">{profileB?.avgYellows ?? "—"}</span>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-muted-foreground">Red Cards / 90:</span>
                    <span className="font-semibold text-destructive">{profileB?.avgReds ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border flex items-center justify-between shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>

          {onNavigateToPredictor && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onNavigateToPredictor(teamA, teamB);
                onClose();
              }}
              className="text-xs gap-1.5 font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Full Match Predictor</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
