import React, { useState, useMemo } from "react";
import {
  Users,
  Swords,
  ArrowRightLeft,
  Calendar,
  Trophy,
  History,
  Target,
  Sparkles,
  BarChart3,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import type { Match, TeamH2H, TeamForm } from "../../lib/types";
import { getAllTeams, computeTeamH2H, computeTeamForm, getTeamAppearances } from "../../lib/teams";
import { calculateScoreProbabilities } from "../../lib/predictions";
import { TeamSearchInput } from "../common/TeamSearchInput";

interface TeamVersusTeamProps {
  matches: Match[];
  initialTeamA?: string;
  initialTeamB?: string;
}

export const TeamVersusTeam: React.FC<TeamVersusTeamProps> = ({
  matches,
  initialTeamA = "Arsenal",
  initialTeamB = "Chelsea",
}) => {
  const [teamA, setTeamA] = useState<string>(initialTeamA);
  const [teamB, setTeamB] = useState<string>(initialTeamB);

  // Get list of all unique teams for autocomplete
  const allTeams = useMemo(() => getAllTeams(matches), [matches]);
  const teamAppearances = useMemo(() => getTeamAppearances(matches), [matches]);

  // Compute Head to Head
  const h2h: TeamH2H = useMemo(() => {
    return computeTeamH2H(matches, teamA, teamB);
  }, [matches, teamA, teamB]);

  // Compute Team Forms
  const formA: TeamForm = useMemo(() => {
    return computeTeamForm(matches, teamA);
  }, [matches, teamA]);

  const formB: TeamForm = useMemo(() => {
    return computeTeamForm(matches, teamB);
  }, [matches, teamB]);

  // Calculate Poisson Score Matrix
  const poisson = useMemo(() => {
    const baseHome = 1.35;
    const baseAway = 1.05;

    const attackA = formA.matchesCount >= 3 ? Math.max(0.6, Math.min(2.2, formA.avgGF / baseHome)) : 1.0;
    const defenseB = formB.matchesCount >= 3 ? Math.max(0.6, Math.min(2.2, formB.avgGA / baseHome)) : 1.0;
    const attackB = formB.matchesCount >= 3 ? Math.max(0.6, Math.min(2.2, formB.avgGF / baseAway)) : 1.0;
    const defenseA = formA.matchesCount >= 3 ? Math.max(0.6, Math.min(2.2, formA.avgGA / baseAway)) : 1.0;

    const lambdaH = Number(Math.max(0.3, Math.min(4.0, baseHome * attackA * defenseB)).toFixed(2));
    const lambdaA = Number(Math.max(0.3, Math.min(4.0, baseAway * attackB * defenseA)).toFixed(2));

    const sim = calculateScoreProbabilities(lambdaH, lambdaA, 5);

    // Goal market calculations
    let over15 = 0;
    let over25 = 0;
    let btts = 0;
    for (const sc of sim.scores) {
      if (sc.homeGoals + sc.awayGoals > 1.5) over15 += sc.probability;
      if (sc.homeGoals + sc.awayGoals > 2.5) over25 += sc.probability;
      if (sc.homeGoals > 0 && sc.awayGoals > 0) btts += sc.probability;
    }

    return {
      lambdaH,
      lambdaA,
      sim,
      over15: Number(over15.toFixed(1)),
      over25: Number(over25.toFixed(1)),
      btts: Number(btts.toFixed(1)),
    };
  }, [formA, formB]);

  const handleSwap = () => {
    const temp = teamA;
    setTeamA(teamB);
    setTeamB(temp);
  };

  return (
    <div className="flex-1 flex flex-col p-2 space-y-6  mx-auto w-full">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Head to Head & Teams
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Compare Head-to-Head records & analyze recent goal threats.
          </p>
        </div>
      </div>

      {/* Team Selection Inputs */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Home Team Input */}
          <div className="w-full md:flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Home Team
            </label>
            <TeamSearchInput
              value={teamA}
              onChange={setTeamA}
              teams={allTeams}
              teamAppearances={teamAppearances}
              placeholder="Search home team..."
            />
          </div>

          {/* Swap Button */}
          <div className="pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwap}
              className="h-9 px-3 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Swap</span>
            </Button>
          </div>

          {/* Away Team Input */}
          <div className="w-full md:flex-1">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Away Team
            </label>
            <TeamSearchInput
              value={teamB}
              onChange={setTeamB}
              teams={allTeams}
              teamAppearances={teamAppearances}
              placeholder="Search away team..."
            />
          </div>
        </div>
      </div>

      {/* Grid: H2H + Side-by-Side Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Head to Head Card */}
        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Head-to-Head Historical Record
            </CardTitle>
            <CardDescription className="text-xs">
              {h2h.totalMatches > 0
                ? `${h2h.totalMatches} historical encounters found in jackpot archives`
                : "No direct head-to-head match recorded in this archive"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {h2h.totalMatches > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <span className="text-xs text-muted-foreground block truncate">{teamA} Wins</span>
                    <span className="text-xl font-bold font-mono text-primary">{h2h.teamAWins}</span>
                    <span className="text-xs text-muted-foreground block">
                      ({((h2h.teamAWins / h2h.totalMatches) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <span className="text-xs text-muted-foreground block">Draws</span>
                    <span className="text-xl font-bold font-mono text-foreground">{h2h.draws}</span>
                    <span className="text-xs text-muted-foreground block">
                      ({((h2h.draws / h2h.totalMatches) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border border-border">
                    <span className="text-xs text-muted-foreground block truncate">{teamB} Wins</span>
                    <span className="text-xl font-bold font-mono text-foreground">{h2h.teamBWins}</span>
                    <span className="text-xs text-muted-foreground block">
                      ({((h2h.teamBWins / h2h.totalMatches) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                  <span>Average Goals in H2H: <strong className="text-foreground">{h2h.avgGoals}</strong></span>
                  <span>Total Encounters: <strong className="text-foreground">{h2h.totalMatches}</strong></span>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-muted-foreground text-xs italic bg-muted/20 rounded-lg border border-dashed border-border">
                Teams have not met in the jackpot dataset. The model will rely primarily on individual team forms and baseline distributions.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Comparison Card */}
        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Recent Form & Performance Comparison
            </CardTitle>
            <CardDescription className="text-xs">
              Last {formA.matchesCount} matches for {teamA} vs {formB.matchesCount} matches for {teamB}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Team A Form */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="font-semibold text-foreground truncate">{teamA} (Home)</div>
                <div className="flex items-center gap-1">
                  {formA.recentResults.slice(0, 5).map((r, i) => (
                    <span
                      key={i}
                      className={`h-5 w-5 rounded text-xs font-bold flex items-center justify-center ${
                        r === "W"
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : r === "D"
                          ? "bg-muted-foreground/20 text-foreground border border-border"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground font-mono">
                  <div>Win Rate: <strong className="text-foreground">{formA.winRate}%</strong></div>
                  <div>Home Win Rate: <strong className="text-foreground">{formA.homeWinRate}%</strong></div>
                  <div>Avg Goals Scored: <strong className="text-foreground">{formA.avgGF}</strong></div>
                  <div>Avg Goals Conceded: <strong className="text-foreground">{formA.avgGA}</strong></div>
                </div>
              </div>

              {/* Team B Form */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                <div className="font-semibold text-foreground truncate">{teamB} (Away)</div>
                <div className="flex items-center gap-1">
                  {formB.recentResults.slice(0, 5).map((r, i) => (
                    <span
                      key={i}
                      className={`h-5 w-5 rounded text-xs font-bold flex items-center justify-center ${
                        r === "W"
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : r === "D"
                          ? "bg-muted-foreground/20 text-foreground border border-border"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground font-mono">
                  <div>Win Rate: <strong className="text-foreground">{formB.winRate}%</strong></div>
                  <div>Away Win Rate: <strong className="text-foreground">{formB.awayWinRate}%</strong></div>
                  <div>Avg Goals Scored: <strong className="text-foreground">{formB.avgGF}</strong></div>
                  <div>Avg Goals Conceded: <strong className="text-foreground">{formB.avgGA}</strong></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Poisson Score Predictions & Probabilities */}
      <Card className="bg-card border-border shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Poisson Score Probability Model
          </CardTitle>
          <CardDescription className="text-xs">
            Expected goals: {teamA} ({poisson.lambdaH}) vs {teamB} ({poisson.lambdaA})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 1X2 Probabilities & Over/Under row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block">Home Win (1)</span>
              <span className="text-lg font-bold font-mono text-primary">{poisson.sim.homeProb}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block">Draw (X)</span>
              <span className="text-lg font-bold font-mono text-foreground">{poisson.sim.drawProb}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block">Away Win (2)</span>
              <span className="text-lg font-bold font-mono text-foreground">{poisson.sim.awayProb}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block">Over 1.5 Goals</span>
              <span className="text-lg font-bold font-mono text-foreground">{poisson.over15}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block">Over 2.5 Goals</span>
              <span className="text-lg font-bold font-mono text-foreground">{poisson.over25}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block">Both To Score (BTTS)</span>
              <span className="text-lg font-bold font-mono text-foreground">{poisson.btts}%</span>
            </div>
          </div>

          {/* Top 8 Ranked Exact Scores */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground block">
              Top Ranked Likely Scores:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {poisson.sim.scores.slice(0, 8).map((sc, i) => (
                <div
                  key={sc.score}
                  className={`p-2.5 rounded-lg border text-center ${
                    i === 0
                      ? "bg-primary/10 border-primary/40"
                      : "bg-muted/30 border-border"
                  }`}
                >
                  <span className="text-sm font-bold font-mono text-foreground block">{sc.score}</span>
                  <span className="text-xs font-mono font-medium text-primary block mt-0.5">
                    {sc.probability}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Rank #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Encounters Table */}
      {h2h.recentEncounters.length > 0 && (
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">
              Past Head-to-Head Encounters in Dataset
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {h2h.recentEncounters.length} recorded matches
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/50 text-muted-foreground font-medium">
                  <TableHead className="px-2 py-1 text-xs">Date</TableHead>
                  <TableHead className="px-2 py-1 text-xs">Home Team</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs">Score</TableHead>
                  <TableHead className="px-2 py-1 text-xs">Away Team</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs">Result</TableHead>
                  <TableHead className="px-2 py-1 text-xs">Jackpot & Bookmaker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {h2h.recentEncounters.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="px-2 py-1 tabular-nums text-xs text-muted-foreground">{m.date || "N/A"}</TableCell>
                    <TableCell className={`px-2 py-1 text-xs font-medium ${m.home_team === teamA ? "text-foreground" : "text-muted-foreground"}`}>
                      {m.home_team}
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-foreground">
                      {m.score || "N/A"}
                    </TableCell>
                    <TableCell className={`px-2 py-1 text-xs font-medium ${m.away_team === teamA ? "text-foreground" : "text-muted-foreground"}`}>
                      {m.away_team}
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center text-xs font-medium uppercase">
                      <span
                        className={
                          m.result === "home"
                            ? "text-emerald-500"
                            : m.result === "draw"
                            ? "text-amber-500"
                            : m.result === "away"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        {m.result || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-xs text-muted-foreground">
                      {m.bookmaker.toUpperCase()}: {m.jackpot}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
