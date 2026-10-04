import React, { useState, useMemo } from "react";
import {
  Trophy,
  Target,
  Goal,
  Flame,
  Shield,
  Activity,
  ChevronRight,
  TrendingUp,
  Percent,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SeasonMatch, LeagueStandingRow } from "../../lib/seasonTypes";
import { computeStandings, computeSeasonOverview } from "../../lib/seasonsAnalytics";

interface SeasonOverviewProps {
  matches: SeasonMatch[];
  seasonName: string;
  onSelectTeam?: (team: string) => void;
}

export const SeasonOverview: React.FC<SeasonOverviewProps> = ({
  matches,
  seasonName,
  onSelectTeam,
}) => {
  const [standingsTab, setStandingsTab] = useState<"overall" | "home" | "away">("overall");

  const overview = useMemo(() => computeSeasonOverview(matches), [matches]);
  const standings: LeagueStandingRow[] = useMemo(() => computeStandings(matches), [matches]);

  // Sorted standings based on selected split (overall, home, away)
  const displayStandings = useMemo(() => {
    if (standingsTab === "overall") return standings;
    if (standingsTab === "home") {
      return [...standings]
        .sort((a, b) => {
          if (b.homePoints !== a.homePoints) return b.homePoints - a.homePoints;
          const gdB = b.homeGF - b.homeGA;
          const gdA = a.homeGF - a.homeGA;
          if (gdB !== gdA) return gdB - gdA;
          return b.homeGF - a.homeGF;
        })
        .map((r, i) => ({ ...r, rank: i + 1 }));
    }
    return [...standings]
      .sort((a, b) => {
        if (b.awayPoints !== a.awayPoints) return b.awayPoints - a.awayPoints;
        const gdB = b.awayGF - b.awayGA;
        const gdA = a.awayGF - a.awayGA;
        if (gdB !== gdA) return gdB - gdA;
        return b.awayGF - a.awayGF;
      })
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [standings, standingsTab]);

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px] flex items-center gap-1">
              <Trophy className="h-3 w-3 text-primary" />
              Matches Played
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-foreground">
              {overview.totalMatches.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px] flex items-center gap-1">
              <Goal className="h-3 w-3 text-primary" />
              Goals / Match
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-primary">
              {overview.goalsPerMatch}
              <span className="text-[11px] text-muted-foreground font-normal ml-1">
                ({overview.totalGoals})
              </span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px] flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              Home Wins
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-emerald-500">
              {overview.homeWinPct}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px] flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
              Draws
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-amber-500">
              {overview.drawPct}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px] flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
              Away Wins
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-blue-500">
              {overview.awayWinPct}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px] flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              Over 2.5 Goals
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-orange-500">
              {overview.over25Pct}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/30 border border-border rounded-xl p-3 text-xs">
        <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
          <span className="text-muted-foreground">Both Teams To Score (BTTS):</span>
          <span className="font-mono font-bold text-foreground">{overview.bttsPct}%</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
          <span className="text-muted-foreground">Clean Sheets Rate:</span>
          <span className="font-mono font-bold text-foreground">{overview.cleanSheetPct}%</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
          <span className="text-muted-foreground">Avg Shots / Match:</span>
          <span className="font-mono font-bold text-foreground">{overview.avgShots}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
          <span className="text-muted-foreground">Avg Corners / Match:</span>
          <span className="font-mono font-bold text-foreground">{overview.avgCorners}</span>
        </div>
      </div>

      {/* Official Standings Section */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Premier League Standings — {seasonName}
            </h2>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {standings.length} Teams
            </Badge>
          </div>

          {/* Standings Split Tabs (Overall / Home / Away) */}
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border text-xs">
            <button
              type="button"
              onClick={() => setStandingsTab("overall")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                standingsTab === "overall"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overall Table
            </button>
            <button
              type="button"
              onClick={() => setStandingsTab("home")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                standingsTab === "home"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Home Only
            </button>
            <button
              type="button"
              onClick={() => setStandingsTab("away")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                standingsTab === "away"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Away Only
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th className="py-2.5 px-3">Team</th>
                <th className="py-2.5 px-2 text-center w-12">Pld</th>
                <th className="py-2.5 px-2 text-center w-12">W</th>
                <th className="py-2.5 px-2 text-center w-12">D</th>
                <th className="py-2.5 px-2 text-center w-12">L</th>
                <th className="py-2.5 px-2 text-center w-14">GF</th>
                <th className="py-2.5 px-2 text-center w-14">GA</th>
                <th className="py-2.5 px-2 text-center w-14">GD</th>
                <th className="py-2.5 px-3 text-center w-16 font-bold text-foreground">Pts</th>
                {standingsTab === "overall" && (
                  <th className="py-2.5 px-3 text-center w-36">Recent Form</th>
                )}
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayStandings.map((row) => {
                const isHome = standingsTab === "home";
                const isAway = standingsTab === "away";
                const pld = isHome ? row.homePlayed : isAway ? row.awayPlayed : row.played;
                const won = isHome ? row.homeWon : isAway ? row.awayWon : row.won;
                const drawn = isHome ? row.homeDrawn : isAway ? row.awayDrawn : row.drawn;
                const lost = isHome ? row.homeLost : isAway ? row.awayLost : row.lost;
                const gf = isHome ? row.homeGF : isAway ? row.awayGF : row.goalsFor;
                const ga = isHome ? row.homeGA : isAway ? row.awayGA : row.goalsAgainst;
                const gd = gf - ga;
                const pts = isHome ? row.homePoints : isAway ? row.awayPoints : row.points;

                // Qualification styling
                const rankColor =
                  row.rank <= 4
                    ? "bg-blue-500/15 text-blue-500 font-bold border-blue-500/30"
                    : row.rank === 5
                    ? "bg-amber-500/15 text-amber-500 font-bold border-amber-500/30"
                    : row.rank >= 18
                    ? "bg-destructive/15 text-destructive font-bold border-destructive/30"
                    : "bg-muted text-muted-foreground border-border";

                return (
                  <tr
                    key={row.team}
                    className="hover:bg-muted/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectTeam && onSelectTeam(row.team)}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center h-5 w-5 rounded text-[11px] font-mono border ${rankColor}`}
                      >
                        {row.rank}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-foreground group-hover:text-primary transition-colors">
                      {row.team}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">{pld}</td>
                    <td className="py-2.5 px-2 text-center font-mono font-medium text-emerald-500">
                      {won}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-medium text-amber-500">
                      {drawn}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-medium text-destructive">
                      {lost}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">{gf}</td>
                    <td className="py-2.5 px-2 text-center font-mono text-muted-foreground">{ga}</td>
                    <td className="py-2.5 px-2 text-center font-mono font-semibold">
                      <span className={gd > 0 ? "text-emerald-500" : gd < 0 ? "text-destructive" : "text-muted-foreground"}>
                        {gd > 0 ? `+${gd}` : gd}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-sm text-foreground bg-muted/20">
                      {pts}
                    </td>
                    {standingsTab === "overall" && (
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {row.form.map((res, i) => (
                            <span
                              key={i}
                              className={`h-4 w-4 rounded-sm text-[9px] font-bold font-mono flex items-center justify-center ${
                                res === "W"
                                  ? "bg-emerald-500 text-white"
                                  : res === "D"
                                  ? "bg-amber-500 text-white"
                                  : "bg-destructive text-white"
                              }`}
                            >
                              {res}
                            </span>
                          ))}
                        </div>
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectTeam) onSelectTeam(row.team);
                        }}
                        className="text-[11px] gap-1 h-6 px-2 text-muted-foreground group-hover:text-primary"
                      >
                        Deep Dive
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
