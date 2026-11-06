import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRightLeft, Calculator, History } from "lucide-react";
import React, { useMemo, useState } from "react";

import { TeamLogo } from "@/components/TeamLogo";
import { calculateScoreProbabilities } from "../../lib/predictions";
import { canonicalTeam } from "../../lib/teamRegistry";
import {
  computeTeamForm,
  computeTeamH2H,
  getAllTeams,
  getTeamAppearances,
} from "../../lib/teams";
import type { Match, TeamForm, TeamH2H } from "../../lib/types";
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

    const attackA =
      formA.matchesCount >= 3
        ? Math.max(0.6, Math.min(2.2, formA.avgGF / baseHome))
        : 1.0;
    const defenseB =
      formB.matchesCount >= 3
        ? Math.max(0.6, Math.min(2.2, formB.avgGA / baseHome))
        : 1.0;
    const attackB =
      formB.matchesCount >= 3
        ? Math.max(0.6, Math.min(2.2, formB.avgGF / baseAway))
        : 1.0;
    const defenseA =
      formA.matchesCount >= 3
        ? Math.max(0.6, Math.min(2.2, formA.avgGA / baseAway))
        : 1.0;

    const lambdaH = Number(
      Math.max(0.3, Math.min(4.0, baseHome * attackA * defenseB)).toFixed(2),
    );
    const lambdaA = Number(
      Math.max(0.3, Math.min(4.0, baseAway * attackB * defenseA)).toFixed(2),
    );

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
      {/* Distilled Head to Head & Form Command Panel */}
      <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
        {/* Top Bar: Selector Controls & Encounter Summary */}
        <div className="px-4 py-2.5 border-b border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="flex-1 min-w-36">
              <TeamSearchInput
                value={teamA}
                onChange={setTeamA}
                teams={allTeams}
                teamAppearances={teamAppearances}
                placeholder="Search home club..."
              />
            </div>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleSwap}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              title="Swap Home and Away teams"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </Button>

            <div className="flex-1 min-w-36">
              <TeamSearchInput
                value={teamB}
                onChange={setTeamB}
                teams={allTeams}
                teamAppearances={teamAppearances}
                placeholder="Search away club..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <History className="h-3.5 w-3.5 text-primary" />
            {h2h.totalMatches > 0 ? (
              <span>
                <strong className="text-foreground">{h2h.totalMatches}</strong> meetings in jackpot archives · Avg{" "}
                <strong className="text-foreground">{h2h.avgGoals}</strong> goals/match
              </span>
            ) : (
              <span className="italic">No prior direct jackpot encounters</span>
            )}
          </div>
        </div>

        {/* Matrix: H2H Split & Team Form Side-by-Side */}
        <div className="p-3.5 bg-muted/20 grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs items-center">
          {/* H2H Distribution (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-2 border-b lg:border-b-0 lg:border-r border-border/70 pb-3 lg:pb-0 lg:pr-4">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Head-to-Head Record
            </span>
            {h2h.totalMatches > 0 ? (
              <>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${(h2h.teamAWins / h2h.totalMatches) * 100}%` }}
                    className="bg-primary transition-all duration-300"
                    title={`${teamA} Wins: ${h2h.teamAWins}`}
                  />
                  <div
                    style={{ width: `${(h2h.draws / h2h.totalMatches) * 100}%` }}
                    className="bg-amber-500 transition-all duration-300"
                    title={`Draws: ${h2h.draws}`}
                  />
                  <div
                    style={{ width: `${(h2h.teamBWins / h2h.totalMatches) * 100}%` }}
                    className="bg-blue-500 transition-all duration-300"
                    title={`${teamB} Wins: ${h2h.teamBWins}`}
                  />
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="py-1 px-1.5 rounded bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block truncate">{teamA}</span>
                    <strong className="text-primary text-xs">{h2h.teamAWins}</strong>
                    <span className="text-[10px] text-muted-foreground block">
                      ({((h2h.teamAWins / h2h.totalMatches) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="py-1 px-1.5 rounded bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block">Draws</span>
                    <strong className="text-foreground text-xs">{h2h.draws}</strong>
                    <span className="text-[10px] text-muted-foreground block">
                      ({((h2h.draws / h2h.totalMatches) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="py-1 px-1.5 rounded bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block truncate">{teamB}</span>
                    <strong className="text-blue-500 text-xs">{h2h.teamBWins}</strong>
                    <span className="text-[10px] text-muted-foreground block">
                      ({((h2h.teamBWins / h2h.totalMatches) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-3 px-3 text-center text-muted-foreground text-xs italic bg-card rounded-md border border-dashed border-border">
                No recorded direct encounters between {teamA} and {teamB} in the jackpot archives. Predictions use individual form baselines.
              </div>
            )}
          </div>

          {/* Form Comparison Side-by-Side (lg:col-span-7) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Team A Form */}
            <div className="p-2.5 rounded-lg bg-card border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                  <TeamLogo team={teamA} size={18} />
                  <span className="truncate">{teamA}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                  Home Venue
                </span>
              </div>
              <div className="flex items-center gap-1">
                {formA.recentResults.slice(0, 5).map((r, i) => (
                  <span
                    key={i}
                    className={`h-4 w-4 rounded text-[10px] font-bold flex items-center justify-center ${
                      r === "W"
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : r === "D"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                <div>Win Rate: <strong className="text-foreground">{formA.winRate}%</strong> (Home: {formA.homeWinRate}%)</div>
                <div>GF / GA: <strong className="text-foreground">{formA.avgGF}</strong> / {formA.avgGA}</div>
              </div>
            </div>

            {/* Team B Form */}
            <div className="p-2.5 rounded-lg bg-card border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-foreground truncate">
                  <TeamLogo team={teamB} size={18} />
                  <span className="truncate">{teamB}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                  Away Venue
                </span>
              </div>
              <div className="flex items-center gap-1">
                {formB.recentResults.slice(0, 5).map((r, i) => (
                  <span
                    key={i}
                    className={`h-4 w-4 rounded text-[10px] font-bold flex items-center justify-center ${
                      r === "W"
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : r === "D"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                <div>Win Rate: <strong className="text-foreground">{formB.winRate}%</strong> (Away: {formB.awayWinRate}%)</div>
                <div>GF / GA: <strong className="text-foreground">{formB.avgGF}</strong> / {formB.avgGA}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Poisson Score Predictions & Probabilities */}
      <Card className="bg-card border-border shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Poisson Score Probability Model
          </CardTitle>
          <CardDescription className="text-xs">
            Poisson distribution based on expected goals: {teamA} ({poisson.lambdaH} xG) vs {teamB} ({poisson.lambdaA} xG)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 1X2 Probabilities & Over/Under row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block truncate">
                Home Win ({teamA})
              </span>
              <span className="text-lg font-bold text-primary">
                {poisson.sim.homeProb}%
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block">
                Draw (X)
              </span>
              <span className="text-lg font-bold text-foreground">
                {poisson.sim.drawProb}%
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block truncate">
                Away Win ({teamB})
              </span>
              <span className="text-lg font-bold text-foreground">
                {poisson.sim.awayProb}%
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block">
                Over 1.5 Goals
              </span>
              <span className="text-lg font-bold text-foreground">
                {poisson.over15}%
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block">
                Over 2.5 Goals
              </span>
              <span className="text-lg font-bold text-foreground">
                {poisson.over25}%
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
              <span className="text-xs text-muted-foreground block">
                Both Teams to Score (BTTS)
              </span>
              <span className="text-lg font-bold text-foreground">
                {poisson.btts}%
              </span>
            </div>
          </div>

          {/* Top 8 Ranked Exact Scores */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground block">
              Most Probable Exact Scores:
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
                  <span className="text-sm font-bold text-foreground block">
                    {sc.score}
                  </span>
                  <span className="text-xs font-medium text-primary block mt-0.5">
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
              Past Meetings in the Jackpot Archive
            </h2>
            <span className="text-xs text-muted-foreground">
              {h2h.recentEncounters.length} recorded matches
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/50 text-muted-foreground font-medium">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Home Team</TableHead>
                  <TableHead className="text-xs">Away Team</TableHead>
                  <TableHead className="text-center text-xs">Score</TableHead>
                  <TableHead className="text-center text-xs">Result</TableHead>
                  <TableHead className="text-xs">Jackpot & Bookmaker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {h2h.recentEncounters.map((m) => (
                  <TableRow
                    key={m.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {m.date || "N/A"}
                    </TableCell>
                    <TableCell
                      className={`text-xs font-medium ${canonicalTeam(m.home_team) === canonicalTeam(teamA) ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <TeamLogo team={m.home_team} size={24} />
                        <span className="truncate">{m.home_team}</span>
                      </span>
                    </TableCell>
                    <TableCell
                      className={`text-xs font-medium ${canonicalTeam(m.away_team) === canonicalTeam(teamA) ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <TeamLogo team={m.away_team} size={24} />
                        <span className="truncate">{m.away_team}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs font-medium text-foreground">
                      {m.score || "N/A"}
                    </TableCell>
                    <TableCell className="text-center text-xs font-medium uppercase">
                      <span
                        className={
                          m.result === "home"
                            ? "text-emerald-500"
                            : m.result === "draw"
                              ? "text-amber-600 dark:text-amber-400"
                              : m.result === "away"
                                ? "text-blue-500"
                                : "text-muted-foreground"
                        }
                      >
                        {m.result || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
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
