import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  Shield,
  Goal,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { SeasonMatch } from "../../lib/seasonTypes";

interface SeasonFixturesTableProps {
  matches: SeasonMatch[];
  onSelectTeamForAnalysis?: (team: string) => void;
}

export const SeasonFixturesTable: React.FC<SeasonFixturesTableProps> = ({
  matches,
  onSelectTeamForAnalysis,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState<string>("all");
  const [goalsFilter, setGoalsFilter] = useState<string>("all");
  const [selectedMatch, setSelectedMatch] = useState<SeasonMatch | null>(null);

  const filteredMatches = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return matches.filter((m) => {
      if (q) {
        const text = `${m.home_team} ${m.away_team} ${m.referee || ""} ${m.score} ${m.season}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (resultFilter !== "all" && m.result !== resultFilter) return false;
      if (goalsFilter === "over25" && m.total_goals <= 2.5) return false;
      if (goalsFilter === "under25" && m.total_goals > 2.5) return false;
      if (goalsFilter === "btts" && (m.home_goals === 0 || m.away_goals === 0)) return false;
      return true;
    });
  }, [matches, searchTerm, resultFilter, goalsFilter]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-card border border-border rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams, referee, score..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-8"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Result Filter */}
          <NativeSelect
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="text-xs h-8 w-32"
          >
            <NativeSelectOption value="all">All Results</NativeSelectOption>
            <NativeSelectOption value="home">Home Wins</NativeSelectOption>
            <NativeSelectOption value="draw">Draws</NativeSelectOption>
            <NativeSelectOption value="away">Away Wins</NativeSelectOption>
          </NativeSelect>

          {/* Goals Filter */}
          <NativeSelect
            value={goalsFilter}
            onChange={(e) => setGoalsFilter(e.target.value)}
            className="text-xs h-8 w-36"
          >
            <NativeSelectOption value="all">All Goal Lines</NativeSelectOption>
            <NativeSelectOption value="over25">Over 2.5 Goals</NativeSelectOption>
            <NativeSelectOption value="under25">Under 2.5 Goals</NativeSelectOption>
            <NativeSelectOption value="btts">Both Teams To Score</NativeSelectOption>
          </NativeSelect>

          <span className="text-xs text-muted-foreground font-mono ml-1">
            {filteredMatches.length} / {matches.length} fixtures
          </span>
        </div>
      </div>

      {/* Match Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10">
              <TableRow className="border-b border-border text-muted-foreground font-medium">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Time</TableHead>
                <TableHead className="text-xs">Match</TableHead>
                <TableHead className="text-center text-xs">Score</TableHead>
                <TableHead className="text-center text-xs">HT</TableHead>
                <TableHead className="text-center text-xs">Shots (SoT)</TableHead>
                <TableHead className="text-center text-xs">Corners</TableHead>
                <TableHead className="text-center text-xs">Cards</TableHead>
                <TableHead className="text-right text-xs">Avg Odds (H/D/A)</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.map((m, idx) => {
                const scoreColor =
                  m.result === "home"
                    ? "text-emerald-500"
                    : m.result === "draw"
                    ? "text-amber-500"
                    : "text-primary";

                const hs = m.stats.home_shots ?? "-";
                const as = m.stats.away_shots ?? "-";
                const hst = m.stats.home_shots_on_target ?? "-";
                const ast = m.stats.away_shots_on_target ?? "-";

                const hc = m.stats.home_corners ?? "-";
                const ac = m.stats.away_corners ?? "-";

                const hy = m.stats.home_yellow ?? 0;
                const ay = m.stats.away_yellow ?? 0;
                const hr = m.stats.home_red ?? 0;
                const ar = m.stats.away_red ?? 0;

                return (
                  <TableRow
                    key={idx}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedMatch(m)}
                  >
                    <TableCell className="tabular-nums text-xs text-muted-foreground">{m.date}</TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">{m.kickoff_time || "-"}</TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      <span className="hover:text-primary transition-colors">{m.home_team}</span>
                      <span className="text-muted-foreground font-normal mx-1">vs</span>
                      <span className="hover:text-primary transition-colors">{m.away_team}</span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs font-medium">
                      <span className={scoreColor}>
                        {m.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {m.half_time_score || "-"}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {hs}:{as} ({hst}:{ast})
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {hc}:{ac}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {hy + ay > 0 && <span>{hy + ay}Y</span>}
                      {hr + ar > 0 && <span className="text-destructive font-medium ml-1">{hr + ar}R</span>}
                      {hy + ay === 0 && hr + ar === 0 && <span>0</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                      {m.odds.home?.toFixed(2) || "-"} / {m.odds.draw?.toFixed(2) || "-"} / {m.odds.away?.toFixed(2) || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMatch(m);
                        }}
                        className="text-xs h-6 px-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Stats
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Match Detail Modal */}
      {selectedMatch && (
        <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
          <DialogContent className="max-w-xl bg-card border-border p-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-mono">
                  {selectedMatch.season} • {selectedMatch.league}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  {selectedMatch.date} {selectedMatch.kickoff_time && `at ${selectedMatch.kickoff_time}`}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground mt-2">
                {selectedMatch.home_team} {selectedMatch.score} {selectedMatch.away_team}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Referee: {selectedMatch.referee || "N/A"} • Half-Time: {selectedMatch.half_time_score || "N/A"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-2">
              {/* Head to Head Shots & Corners Table */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                <span className="font-semibold text-foreground text-xs block">Match Statistics:</span>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <span className="font-bold text-sm text-foreground">{selectedMatch.home_team}</span>
                  <span className="text-muted-foreground text-xs font-sans">Metric</span>
                  <span className="font-bold text-sm text-foreground">{selectedMatch.away_team}</span>

                  <span className="text-foreground">{selectedMatch.stats.home_shots ?? "-"}</span>
                  <span className="text-muted-foreground font-sans">Total Shots</span>
                  <span className="text-foreground">{selectedMatch.stats.away_shots ?? "-"}</span>

                  <span className="text-foreground">{selectedMatch.stats.home_shots_on_target ?? "-"}</span>
                  <span className="text-muted-foreground font-sans">Shots on Target</span>
                  <span className="text-foreground">{selectedMatch.stats.away_shots_on_target ?? "-"}</span>

                  <span className="text-foreground">{selectedMatch.stats.home_corners ?? "-"}</span>
                  <span className="text-muted-foreground font-sans">Corners</span>
                  <span className="text-foreground">{selectedMatch.stats.away_corners ?? "-"}</span>

                  <span className="text-foreground">{selectedMatch.stats.home_fouls ?? "-"}</span>
                  <span className="text-muted-foreground font-sans">Fouls</span>
                  <span className="text-foreground">{selectedMatch.stats.away_fouls ?? "-"}</span>

                  <span className="text-foreground">{selectedMatch.stats.home_yellow ?? 0}</span>
                  <span className="text-muted-foreground font-sans">Yellow Cards</span>
                  <span className="text-foreground">{selectedMatch.stats.away_yellow ?? 0}</span>

                  <span className="text-destructive font-bold">{selectedMatch.stats.home_red ?? 0}</span>
                  <span className="text-muted-foreground font-sans">Red Cards</span>
                  <span className="text-destructive font-bold">{selectedMatch.stats.away_red ?? 0}</span>
                </div>
              </div>

              {/* Bookmaker Odds Matrix */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                <span className="font-semibold text-foreground text-xs block">Market Odds &amp; Lines:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block font-sans">Pre-Match (H/D/A)</span>
                    <span className="font-bold text-foreground">
                      {selectedMatch.odds.home ?? "-"} / {selectedMatch.odds.draw ?? "-"} / {selectedMatch.odds.away ?? "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block font-sans">Closing (H/D/A)</span>
                    <span className="font-bold text-foreground">
                      {selectedMatch.odds.home_close ?? "-"} / {selectedMatch.odds.draw_close ?? "-"} / {selectedMatch.odds.away_close ?? "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block font-sans">Over / Under 2.5</span>
                    <span className="font-bold text-orange-500">
                      {selectedMatch.odds.over_2_5 ?? "-"} / {selectedMatch.odds.under_2_5 ?? "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block font-sans">Asian Handicap Line</span>
                    <span className="font-bold text-foreground">
                      {selectedMatch.odds.handicap ?? "-"} ({selectedMatch.odds.handicap_home ?? "-"} / {selectedMatch.odds.handicap_away ?? "-"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onSelectTeamForAnalysis) onSelectTeamForAnalysis(selectedMatch.home_team);
                    setSelectedMatch(null);
                  }}
                  className="text-xs"
                >
                  Analyze {selectedMatch.home_team}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onSelectTeamForAnalysis) onSelectTeamForAnalysis(selectedMatch.away_team);
                    setSelectedMatch(null);
                  }}
                  className="text-xs"
                >
                  Analyze {selectedMatch.away_team}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
