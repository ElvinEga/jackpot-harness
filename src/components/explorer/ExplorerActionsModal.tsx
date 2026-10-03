import React, { useState, useMemo, useEffect } from "react";
import {
  Swords,
  Layers,
  Sparkles,
  Goal,
  ArrowRightLeft,
  Calendar,
  History,
  Target,
  Trophy,
  Search,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import type { Match, PositionStat } from "../../lib/types";
import { getAllTeams, computeTeamH2H, computeTeamForm } from "../../lib/teams";
import { computePositionStats } from "../../lib/positions";
import { predictMatch, calculateScoreProbabilities } from "../../lib/predictions";

export type ExplorerActionType = "h2h" | "position" | "likelihood" | "goals";

interface ExplorerActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: ExplorerActionType;
  selectedMatches: Match[];
  allMatches: Match[];
  onNavigateToH2H?: (teamA: string, teamB: string) => void;
}

export const ExplorerActionsModal: React.FC<ExplorerActionsModalProps> = ({
  isOpen,
  onClose,
  initialAction = "h2h",
  selectedMatches,
  allMatches,
  onNavigateToH2H,
}) => {
  const [activeTab, setActiveTab] = useState<ExplorerActionType>(initialAction);

  // Focus match (first selected or latest)
  const focusMatch = selectedMatches[0] || null;

  // Custom team inputs for Team vs Team
  const [teamA, setTeamA] = useState<string>(focusMatch?.home_team || "Arsenal");
  const [teamB, setTeamB] = useState<string>(focusMatch?.away_team || "Chelsea");
  const [selectedPosition, setSelectedPosition] = useState<number>(focusMatch?.position || 1);

  // Update teams when focusMatch changes or modal opens
  useEffect(() => {
    if (focusMatch) {
      setTeamA(focusMatch.home_team);
      setTeamB(focusMatch.away_team);
      if (focusMatch.position) {
        setSelectedPosition(focusMatch.position);
      }
    }
  }, [focusMatch, isOpen]);

  useEffect(() => {
    setActiveTab(initialAction);
  }, [initialAction, isOpen]);

  // Unique teams list for autocomplete
  const allTeams = useMemo(() => getAllTeams(allMatches), [allMatches]);

  // Position statistics (1..20)
  const positionStats: PositionStat[] = useMemo(() => {
    return computePositionStats(allMatches, 20);
  }, [allMatches]);

  const currentPosStat = useMemo(() => {
    return positionStats.find((p) => p.position === selectedPosition) || positionStats[0];
  }, [positionStats, selectedPosition]);

  // Head-to-Head analysis
  const h2h = useMemo(() => {
    return computeTeamH2H(allMatches, teamA, teamB);
  }, [allMatches, teamA, teamB]);

  // Team Forms
  const formA = useMemo(() => computeTeamForm(allMatches, teamA), [allMatches, teamA]);
  const formB = useMemo(() => computeTeamForm(allMatches, teamB), [allMatches, teamB]);

  // Poisson & Prediction
  const prediction = useMemo(() => {
    return predictMatch(allMatches, teamA, teamB, selectedPosition, positionStats);
  }, [allMatches, teamA, teamB, selectedPosition, positionStats]);

  // Goals & Probabilities
  const goalsModel = useMemo(() => {
    const baseHome = 1.35;
    const baseAway = 1.05;

    const attackA = formA.matchesCount >= 3 ? Math.max(0.6, Math.min(2.2, formA.avgGF / baseHome)) : 1.0;
    const defenseB = formB.matchesCount >= 3 ? Math.max(0.6, Math.min(2.2, formB.avgGA / baseHome)) : 1.0;
    const attackB = formB.matchesCount >= 3 ? Math.max(0.6, Math.min(2.2, formB.avgGF / baseAway)) : 1.0;
    const defenseA = formA.matchesCount >= 3 ? Math.max(0.6, Math.min(2.2, formA.avgGA / baseAway)) : 1.0;

    const lambdaH = Number(Math.max(0.3, Math.min(4.0, baseHome * attackA * defenseB)).toFixed(2));
    const lambdaA = Number(Math.max(0.3, Math.min(4.0, baseAway * attackB * defenseA)).toFixed(2));

    const sim = calculateScoreProbabilities(lambdaH, lambdaA, 5);

    let over15 = 0;
    let over25 = 0;
    let over35 = 0;
    let btts = 0;
    for (const sc of sim.scores) {
      const tot = sc.homeGoals + sc.awayGoals;
      if (tot > 1.5) over15 += sc.probability;
      if (tot > 2.5) over25 += sc.probability;
      if (tot > 3.5) over35 += sc.probability;
      if (sc.homeGoals > 0 && sc.awayGoals > 0) btts += sc.probability;
    }

    return {
      lambdaH,
      lambdaA,
      sim,
      over15: Number(over15.toFixed(1)),
      over25: Number(over25.toFixed(1)),
      over35: Number(over35.toFixed(1)),
      btts: Number(btts.toFixed(1)),
    };
  }, [formA, formB]);

  const handleSwap = () => {
    const temp = teamA;
    setTeamA(teamB);
    setTeamB(temp);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border p-5">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Match & Historical Intelligence Actions
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {selectedMatches.length > 1
                    ? `Inspecting ${selectedMatches.length} selected jackpot records`
                    : focusMatch
                    ? `${focusMatch.home_team} vs ${focusMatch.away_team} · Position #${focusMatch.position}`
                    : "Analyze teams, row positions, outcome likelihoods, and goal expectations"}
                </DialogDescription>
              </div>
            </div>

            {selectedMatches.length > 0 && (
              <Badge variant="outline" className="text-xs font-mono">
                {selectedMatches.length} Row{selectedMatches.length > 1 ? "s" : ""} Selected
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as ExplorerActionType)} className="w-full pt-2">
          <TabsList className="grid grid-cols-4 h-9">
            <TabsTrigger value="h2h" className="text-xs gap-1.5">
              <Swords className="h-3.5 w-3.5 text-amber-400" />
              <span>Team vs Team</span>
            </TabsTrigger>
            <TabsTrigger value="position" className="text-xs gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span>Position Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="likelihood" className="text-xs gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Team Likelihood</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="text-xs gap-1.5">
              <Goal className="h-3.5 w-3.5 text-emerald-400" />
              <span>Average Goals</span>
            </TabsTrigger>
          </TabsList>

          {/* 1. Team vs Team View */}
          <TabsContent value="h2h" className="space-y-4 pt-3 text-xs">
            {/* Team Selectors */}
            <div className="p-3 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row items-center gap-2">
              <div className="w-full sm:flex-1 relative">
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Home Team</label>
                <Input
                  list="h2h-teams-a"
                  value={teamA}
                  onChange={(e) => setTeamA(e.target.value)}
                  className="h-8 text-xs font-semibold"
                />
                <datalist id="h2h-teams-a">
                  {allTeams.slice(0, 150).map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <div className="pt-4">
                <Button variant="outline" size="sm" onClick={handleSwap} className="h-8 px-2.5">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="w-full sm:flex-1 relative">
                <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Away Team</label>
                <Input
                  list="h2h-teams-b"
                  value={teamB}
                  onChange={(e) => setTeamB(e.target.value)}
                  className="h-8 text-xs font-semibold"
                />
                <datalist id="h2h-teams-b">
                  {allTeams.slice(0, 150).map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* H2H Results */}
            {h2h.totalMatches > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block truncate">{teamA} Wins</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{h2h.teamAWins}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {((h2h.teamAWins / h2h.totalMatches) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block">Draws</span>
                    <span className="text-xl font-bold font-mono text-amber-400">{h2h.draws}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {((h2h.draws / h2h.totalMatches) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block truncate">{teamB} Wins</span>
                    <span className="text-xl font-bold font-mono text-blue-400">{h2h.teamBWins}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {((h2h.teamBWins / h2h.totalMatches) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs px-2 text-muted-foreground font-mono">
                  <span>Average goals per encounter: <strong className="text-foreground">{h2h.avgGoals}</strong></span>
                  <span>Total meetings: <strong className="text-foreground">{h2h.totalMatches}</strong></span>
                </div>

                {/* Encounters List */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted/40 px-3 py-2 border-b border-border font-semibold text-foreground text-xs">
                    Past Encounters in Jackpot Dataset
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-border">
                    {h2h.recentEncounters.map((m) => (
                      <div key={m.id} className="px-3 py-2 flex items-center justify-between hover:bg-muted/20">
                        <span className="font-mono text-muted-foreground text-[11px]">{m.date || "N/A"}</span>
                        <div className="font-medium text-foreground">
                          {m.home_team} <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-muted mx-1">{m.score || "—"}</span> {m.away_team}
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {m.result}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground text-xs italic bg-muted/20 rounded-lg border border-dashed border-border">
                No direct historical encounter between {teamA} and {teamB} in the jackpot archives.
              </div>
            )}

            {/* Link to Full H2H Page */}
            {onNavigateToH2H && (
              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onNavigateToH2H(teamA, teamB);
                    onClose();
                  }}
                  className="text-xs gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Full H2H & Poisson Page
                </Button>
              </div>
            )}
          </TabsContent>

          {/* 2. Position / Row Analysis View */}
          <TabsContent value="position" className="space-y-4 pt-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Inspect Row Position:</span>
                <NativeSelect
                  value={String(selectedPosition)}
                  onChange={(e) => setSelectedPosition(Number(e.target.value))}
                  className="h-8 text-xs w-28 font-mono"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((p) => (
                    <NativeSelectOption key={p} value={p}>
                      Row #{p}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <span className="text-muted-foreground text-[11px]">
                {currentPosStat?.totalMatches.toLocaleString()} jackpots analyzed
              </span>
            </div>

            {currentPosStat && (
              <div className="space-y-3">
                {/* 1X2 Split for this row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block">Row #{selectedPosition} Home Win</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">{currentPosStat.homeWinPct}%</span>
                    <span className="text-[10px] text-muted-foreground">{currentPosStat.homeWins} wins</span>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block">Row #{selectedPosition} Draw</span>
                    <span className="text-xl font-bold font-mono text-amber-400">{currentPosStat.drawPct}%</span>
                    <span className="text-[10px] text-muted-foreground">{currentPosStat.draws} draws</span>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block">Row #{selectedPosition} Away Win</span>
                    <span className="text-xl font-bold font-mono text-blue-400">{currentPosStat.awayWinPct}%</span>
                    <span className="text-[10px] text-muted-foreground">{currentPosStat.awayWins} wins</span>
                  </div>
                </div>

                {/* Goal metrics for this row */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block">Avg Goals / Match</span>
                    <span className="text-lg font-bold font-mono text-foreground">{currentPosStat.avgGoals}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block">Over 2.5 %</span>
                    <span className="text-lg font-bold font-mono text-foreground">{currentPosStat.over25Pct}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block">BTTS %</span>
                    <span className="text-lg font-bold font-mono text-foreground">{currentPosStat.bttsPct}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground block">Most Frequent</span>
                    <span className="text-lg font-bold font-mono text-primary">{currentPosStat.mostLikelyScore}</span>
                  </div>
                </div>

                {/* Top 5 Scores for this Row */}
                <div className="p-3 rounded-lg bg-card border border-border">
                  <span className="font-semibold text-foreground block mb-2">Most Common Scores in Row #{selectedPosition}:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentPosStat.topScores.map((ts) => (
                      <span key={ts.score} className="px-2 py-1 rounded bg-muted border border-border font-mono text-xs">
                        <strong className="text-foreground">{ts.score}</strong>: {ts.pct}% ({ts.count} times)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 3. Team Likelihood View */}
          <TabsContent value="likelihood" className="space-y-4 pt-3 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-muted/40 border border-border">
              <div className="p-2.5 rounded bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">Home Win ({teamA})</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{prediction.homeProb}%</span>
              </div>
              <div className="p-2.5 rounded bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">Draw (X)</span>
                <span className="text-xl font-bold font-mono text-amber-400">{prediction.drawProb}%</span>
              </div>
              <div className="p-2.5 rounded bg-card border border-border">
                <span className="text-muted-foreground text-[10px] block">Away Win ({teamB})</span>
                <span className="text-xl font-bold font-mono text-blue-400">{prediction.awayProb}%</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Model Verdict:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs uppercase font-bold">
                    {prediction.predictedResult.toUpperCase()}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Confidence: <strong>{prediction.confidence}</strong>
                  </span>
                </div>
              </div>

              {/* Signals */}
              <div className="space-y-1.5 pt-1">
                {prediction.signals.map((sig, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/30 border border-border">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-foreground">{sig.label}:</span>{" "}
                      <span className="text-muted-foreground text-[11px]">{sig.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Likely Scores */}
            <div className="space-y-2">
              <span className="font-semibold text-foreground block">Top 5 Predicted Scores (Poisson):</span>
              <div className="grid grid-cols-5 gap-2">
                {prediction.mostLikelyScores.map((sc) => (
                  <div key={sc.score} className="p-2 rounded bg-muted/40 border border-border text-center">
                    <span className="font-mono font-bold text-sm text-foreground block">{sc.score}</span>
                    <span className="text-[10px] text-primary font-mono">{sc.probability}%</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* 4. Average Goals View */}
          <TabsContent value="goals" className="space-y-4 pt-3 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Expected Goals ({teamA})</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{goalsModel.lambdaH}</span>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Expected Goals ({teamB})</span>
                <span className="text-xl font-bold font-mono text-blue-400">{goalsModel.lambdaA}</span>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Total Expected Goals</span>
                <span className="text-xl font-bold font-mono text-primary">
                  {Number((goalsModel.lambdaH + goalsModel.lambdaA).toFixed(2))}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <span className="text-[10px] text-muted-foreground block">Both To Score (BTTS)</span>
                <span className="text-xl font-bold font-mono text-foreground">{goalsModel.btts}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground block">Over 1.5 Goals %</span>
                <span className="text-base font-bold font-mono text-foreground">{goalsModel.over15}%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground block">Over 2.5 Goals %</span>
                <span className="text-base font-bold font-mono text-foreground">{goalsModel.over25}%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                <span className="text-[10px] text-muted-foreground block">Over 3.5 Goals %</span>
                <span className="text-base font-bold font-mono text-foreground">{goalsModel.over35}%</span>
              </div>
            </div>

            {/* Top 6 Scores */}
            <div className="space-y-2">
              <span className="font-semibold text-foreground block">Poisson Score Distribution:</span>
              <div className="grid grid-cols-6 gap-2">
                {goalsModel.sim.scores.slice(0, 6).map((sc, i) => (
                  <div key={sc.score} className="p-2 rounded bg-muted/30 border border-border text-center">
                    <span className="font-mono font-bold text-xs text-foreground block">{sc.score}</span>
                    <span className="text-[10px] text-primary font-mono">{sc.probability}%</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
