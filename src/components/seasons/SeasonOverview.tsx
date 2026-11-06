import { TeamLogo } from "@/components/TeamLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight, Trophy } from "lucide-react";
import React, { useMemo, useState } from "react";
import type { LeagueStandingRow, SeasonMatch } from "../../lib/seasonTypes";
import {
  computeSeasonOverview,
  computeStandings,
} from "../../lib/seasonsAnalytics";

interface SeasonOverviewProps {
  matches: SeasonMatch[];
  seasonName: string;
  leagueName?: string;
  onSelectTeam?: (team: string) => void;
}

export const SeasonOverview: React.FC<SeasonOverviewProps> = ({
  matches,
  seasonName,
  leagueName,
  onSelectTeam,
}) => {
  const [standingsTab, setStandingsTab] = useState<"overall" | "home" | "away">(
    "overall",
  );

  const resolvedLeagueName = useMemo(() => {
    return leagueName || matches[0]?.league?.replace(/.*–\s*/, "") || "League";
  }, [leagueName, matches]);

  const overview = useMemo(() => computeSeasonOverview(matches), [matches]);
  const standings: LeagueStandingRow[] = useMemo(
    () => computeStandings(matches),
    [matches],
  );

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
      {/* Statistical Overview Ribbon — High-density quantitative summary */}
      <div className="bg-card border border-border rounded-md p-3.5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-foreground" />
            <span className="font-semibold text-foreground">{resolvedLeagueName} ({seasonName})</span>
            <span className="text-muted-foreground">· {overview.totalMatches.toLocaleString()} matches</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-muted-foreground mr-1">Goals/m:</span>
              <span className="font-bold text-foreground">{overview.goalsPerMatch}</span>
              <span className="text-[11px] text-muted-foreground font-normal ml-1">({overview.totalGoals})</span>
            </div>
            <div>
              <span className="text-muted-foreground mr-1">Over 2.5:</span>
              <span className="font-bold text-foreground">{overview.over25Pct}%</span>
            </div>
            <div>
              <span className="text-muted-foreground mr-1">BTTS:</span>
              <span className="font-bold text-foreground">{overview.bttsPct}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-sm bg-muted/40 border border-border">
            <span className="text-muted-foreground">Home Wins:</span>
            <span className="font-bold text-foreground">{overview.homeWinPct}%</span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-sm bg-muted/40 border border-border">
            <span className="text-muted-foreground">Draws:</span>
            <span className="font-bold text-foreground">{overview.drawPct}%</span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-sm bg-muted/40 border border-border">
            <span className="text-muted-foreground">Away Wins:</span>
            <span className="font-bold text-foreground">{overview.awayWinPct}%</span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-sm bg-muted/40 border border-border">
            <span className="text-muted-foreground">Clean Sheets:</span>
            <span className="font-bold text-foreground">{overview.cleanSheetPct}%</span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-sm bg-muted/40 border border-border">
            <span className="text-muted-foreground">Avg Shots:</span>
            <span className="font-bold text-foreground">{overview.avgShots}</span>
          </div>
        </div>
      </div>

      {/* Official Standings Section */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              {resolvedLeagueName} Standings — {seasonName}
            </h2>
            <Badge variant="secondary" className="text-[10px]">
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
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-muted-foreground font-medium">
                <TableHead className="text-center w-10 text-xs">#</TableHead>
                <TableHead className="text-xs">Team</TableHead>
                <TableHead className="text-center w-10 text-xs">Pld</TableHead>
                <TableHead className="text-center w-10 text-xs">W</TableHead>
                <TableHead className="text-center w-10 text-xs">D</TableHead>
                <TableHead className="text-center w-10 text-xs">L</TableHead>
                <TableHead className="text-center w-12 text-xs">GF</TableHead>
                <TableHead className="text-center w-12 text-xs">GA</TableHead>
                <TableHead className="text-center w-12 text-xs">GD</TableHead>
                <TableHead className="text-center w-12 text-xs font-medium text-foreground">
                  Pts
                </TableHead>
                {standingsTab === "overall" && (
                  <TableHead className="text-center w-28 text-xs">
                    Recent Form
                  </TableHead>
                )}
                <TableHead className="text-right text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayStandings.map((row) => {
                const isHome = standingsTab === "home";
                const isAway = standingsTab === "away";
                const pld = isHome
                  ? row.homePlayed
                  : isAway
                    ? row.awayPlayed
                    : row.played;
                const won = isHome
                  ? row.homeWon
                  : isAway
                    ? row.awayWon
                    : row.won;
                const drawn = isHome
                  ? row.homeDrawn
                  : isAway
                    ? row.awayDrawn
                    : row.drawn;
                const lost = isHome
                  ? row.homeLost
                  : isAway
                    ? row.awayLost
                    : row.lost;
                const gf = isHome
                  ? row.homeGF
                  : isAway
                    ? row.awayGF
                    : row.goalsFor;
                const ga = isHome
                  ? row.homeGA
                  : isAway
                    ? row.awayGA
                    : row.goalsAgainst;
                const gd = gf - ga;
                const pts = isHome
                  ? row.homePoints
                  : isAway
                    ? row.awayPoints
                    : row.points;

                // Qualification styling
                const rankColor =
                  row.rank <= 4
                    ? "text-primary"
                    : row.rank === 5
                      ? "text-amber-500"
                      : row.rank >= 18
                        ? "text-destructive"
                        : "text-muted-foreground";

                return (
                  <TableRow
                    key={row.team}
                    className="hover:bg-muted/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectTeam && onSelectTeam(row.team)}
                  >
                    <TableCell className="text-center">
                      <span
                        className={`tabular-nums text-xs font-medium ${rankColor}`}
                      >
                        {row.rank}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-xs text-foreground group-hover:text-primary transition-colors">
                      <span className="flex items-center gap-2">
                        <TeamLogo team={row.team} size={24} />
                        {row.team}
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {pld}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {won}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {drawn}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {lost}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {gf}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {ga}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs font-medium">
                      <span
                        className={
                          gd > 0
                            ? "text-emerald-500"
                            : gd < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }
                      >
                        {gd > 0 ? `+${gd}` : gd}
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs font-medium text-foreground">
                      {pts}
                    </TableCell>
                    {standingsTab === "overall" && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {row.form.map((res, i) => (
                            <span
                              key={i}
                              className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white ${
                                res === "W"
                                  ? "bg-emerald-500"
                                  : res === "D"
                                    ? "bg-amber-500"
                                    : "bg-destructive"
                              }`}
                            >
                              {res}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
