import { TeamLogo } from "@/components/TeamLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Search } from "lucide-react";
import React, { useMemo, useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { SeasonMatch } from "../../lib/seasonTypes";
import { isDecidedSeasonMatch } from "../../lib/seasonTypes";
import { canonicalTeam } from "../../lib/teamRegistry";

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
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredMatches = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return matches.filter((m) => {
      if (q) {
        const text =
          `${m.home_team} ${m.away_team} ${m.referee || ""} ${m.score || ""} ${m.season}`.toLowerCase();
        // Searching a club by a spelling this row does not use ("Sheffield Utd")
        // must still find it, so match the club id as well as the letters.
        const qId = canonicalTeam(q);
        if (
          !text.includes(q) &&
          qId !== canonicalTeam(m.home_team) &&
          qId !== canonicalTeam(m.away_team)
        )
          return false;
      }
      if (resultFilter !== "all" && m.result !== resultFilter) return false;
      if (goalsFilter !== "all") {
        if (!isDecidedSeasonMatch(m)) return false;
        if (goalsFilter === "over25" && m.total_goals <= 2.5) return false;
        if (goalsFilter === "under25" && m.total_goals > 2.5) return false;
        if (
          goalsFilter === "btts" &&
          (m.home_goals === 0 || m.away_goals === 0)
        )
          return false;
      }
      return true;
    });
  }, [matches, searchTerm, resultFilter, goalsFilter]);

  const rowVirtualizer = useVirtualizer({
    count: filteredMatches.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0]?.start ?? 0 : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0;

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-card border border-border rounded-md">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams, referee, score..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Result Filter */}
          <NativeSelect
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="text-xs w-32"
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
            className="text-xs w-36"
          >
            <NativeSelectOption value="all">All Goal Lines</NativeSelectOption>
            <NativeSelectOption value="over25">
              Over 2.5 Goals
            </NativeSelectOption>
            <NativeSelectOption value="under25">
              Under 2.5 Goals
            </NativeSelectOption>
            <NativeSelectOption value="btts">
              Both Teams To Score
            </NativeSelectOption>
          </NativeSelect>

          <span className="text-xs text-muted-foreground ml-1">
            {filteredMatches.length} / {matches.length} fixtures
          </span>
        </div>
      </div>

      {/* Match Table */}
      <div className="bg-card border border-border rounded-md shadow-xs overflow-hidden">
        <div ref={parentRef} className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur z-10">
              <TableRow className="border-b border-border text-muted-foreground font-medium">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Time</TableHead>
                <TableHead className="text-xs">Home Team</TableHead>
                <TableHead className="text-xs">Away Team</TableHead>
                <TableHead className="text-center text-xs">Score</TableHead>
                <TableHead className="text-center text-xs">HT</TableHead>
                <TableHead className="text-center text-xs">
                  Shots (SoT)
                </TableHead>
                <TableHead className="text-center text-xs">Corners</TableHead>
                <TableHead className="text-center text-xs">Cards</TableHead>
                <TableHead className="text-right text-xs">
                  Avg Odds (H/D/A)
                </TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paddingTop > 0 && (
                <TableRow style={{ height: `${paddingTop}px` }}>
                  <TableCell colSpan={11} className="p-0 border-0" />
                </TableRow>
              )}
              {virtualItems.map((virtualRow) => {
                const m = filteredMatches[virtualRow.index];
                if (!m) return null;

                const scoreColor =
                  m.result === "home"
                    ? "text-win-home font-semibold"
                    : m.result === "draw"
                      ? "text-draw font-semibold"
                      : "text-win-away font-semibold";

                const hs = m.stats.home_shots ?? "-";
                const as = m.stats.away_shots ?? "-";
                const hst = m.stats.home_shots_on_target ?? "-";
                const ast = m.stats.away_shots_on_target ?? "-";

                const hc = m.stats.home_corners ?? "-";
                const ac = m.stats.away_corners ?? "-";

                const hy = m.stats.home_yellow;
                const ay = m.stats.away_yellow;
                const hr = m.stats.home_red;
                const ar = m.stats.away_red;
                // 41 rows carry no card data at all; a summed 0 there reads as
                // "nobody was booked", so the cell shows the same dash as shots.
                const cardsKnown = hy !== null || ay !== null || hr !== null || ar !== null;
                const yellows = (hy ?? 0) + (ay ?? 0);
                const reds = (hr ?? 0) + (ar ?? 0);

                return (
                  <TableRow
                    key={`${m.date}_${m.home_team}_${m.away_team}`}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedMatch(m)}
                  >
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {m.date}
                    </TableCell>
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {m.kickoff_time || "-"}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      <span className="flex items-center gap-1.5" title={m.home_team}>
                        <TeamLogo team={m.home_team} size={24} />
                        <span className="hover:text-primary transition-colors truncate max-w-[152px]">
                          {m.home_team}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      <span className="flex items-center gap-1.5" title={m.away_team}>
                        <TeamLogo team={m.away_team} size={24} />
                        <span className="hover:text-primary transition-colors truncate max-w-[152px]">
                          {m.away_team}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs font-medium">
                      <span className={scoreColor}>{m.score}</span>
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
                      {yellows > 0 && <span>{yellows}Y</span>}
                      {reds > 0 && (
                        <span className="text-destructive font-medium ml-1">
                          {reds}R
                        </span>
                      )}
                      {cardsKnown && yellows === 0 && reds === 0 && <span>0</span>}
                      {!cardsKnown && <span>-</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                      {m.odds.home?.toFixed(2) || "-"} /{" "}
                      {m.odds.draw?.toFixed(2) || "-"} /{" "}
                      {m.odds.away?.toFixed(2) || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMatch(m);
                        }}
                        className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Stats
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paddingBottom > 0 && (
                <TableRow style={{ height: `${paddingBottom}px` }}>
                  <TableCell colSpan={11} className="p-0 border-0" />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Match Detail Modal */}
      {selectedMatch && (
        <Dialog
          open={!!selectedMatch}
          onOpenChange={(open) => !open && setSelectedMatch(null)}
        >
          <DialogContent className="sm:max-w-xl bg-card border-border p-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {selectedMatch.season} • {selectedMatch.league}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {selectedMatch.date}{" "}
                  {selectedMatch.kickoff_time &&
                    `at ${selectedMatch.kickoff_time}`}
                </span>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground mt-2 flex items-center gap-2">
                <TeamLogo team={selectedMatch.home_team} size={24} />
                <span>{selectedMatch.home_team}</span>
                <span className="text-base px-2 py-0.5 rounded bg-muted border border-border">
                  {selectedMatch.score || "—"}
                </span>
                <span>{selectedMatch.away_team}</span>
                <TeamLogo team={selectedMatch.away_team} size={24} />
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Referee: {selectedMatch.referee || "N/A"} • Half-Time:{" "}
                {selectedMatch.half_time_score || "N/A"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs mt-2">
              {/* Head to Head Shots & Corners Table */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                <span className="font-semibold text-foreground text-xs block">
                  Match Statistics:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <span className="flex items-center justify-center gap-1.5 font-bold text-sm text-foreground">
                    <TeamLogo team={selectedMatch.home_team} size={24} />
                    <span className="truncate">{selectedMatch.home_team}</span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Metric
                  </span>
                  <span className="flex items-center justify-center gap-1.5 font-bold text-sm text-foreground">
                    <TeamLogo team={selectedMatch.away_team} size={24} />
                    <span className="truncate">{selectedMatch.away_team}</span>
                  </span>

                  <span className="text-foreground">
                    {selectedMatch.stats.home_shots ?? "-"}
                  </span>
                  <span className="text-muted-foreground">
                    Total Shots
                  </span>
                  <span className="text-foreground">
                    {selectedMatch.stats.away_shots ?? "-"}
                  </span>

                  <span className="text-foreground">
                    {selectedMatch.stats.home_shots_on_target ?? "-"}
                  </span>
                  <span className="text-muted-foreground">
                    Shots on Target
                  </span>
                  <span className="text-foreground">
                    {selectedMatch.stats.away_shots_on_target ?? "-"}
                  </span>

                  <span className="text-foreground">
                    {selectedMatch.stats.home_corners ?? "-"}
                  </span>
                  <span className="text-muted-foreground">
                    Corners
                  </span>
                  <span className="text-foreground">
                    {selectedMatch.stats.away_corners ?? "-"}
                  </span>

                  <span className="text-foreground">
                    {selectedMatch.stats.home_fouls ?? "-"}
                  </span>
                  <span className="text-muted-foreground">Fouls</span>
                  <span className="text-foreground">
                    {selectedMatch.stats.away_fouls ?? "-"}
                  </span>

                  <span className="text-foreground">
                    {selectedMatch.stats.home_yellow ?? "-"}
                  </span>
                  <span className="text-muted-foreground">
                    Yellow Cards
                  </span>
                  <span className="text-foreground">
                    {selectedMatch.stats.away_yellow ?? "-"}
                  </span>

                  <span className="text-destructive font-bold">
                    {selectedMatch.stats.home_red ?? "-"}
                  </span>
                  <span className="text-muted-foreground">
                    Red Cards
                  </span>
                  <span className="text-destructive font-bold">
                    {selectedMatch.stats.away_red ?? "-"}
                  </span>
                </div>
              </div>

              {/* Bookmaker Odds Matrix */}
              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                <span className="font-semibold text-foreground text-xs block">
                  Market Odds &amp; Lines:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block">
                      Pre-Match (H/D/A)
                    </span>
                    <span className="font-bold text-foreground">
                      {selectedMatch.odds.home ?? "-"} /{" "}
                      {selectedMatch.odds.draw ?? "-"} /{" "}
                      {selectedMatch.odds.away ?? "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block">
                      Closing (H/D/A)
                    </span>
                    <span className="font-bold text-foreground">
                      {selectedMatch.odds.home_close ?? "-"} /{" "}
                      {selectedMatch.odds.draw_close ?? "-"} /{" "}
                      {selectedMatch.odds.away_close ?? "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block">
                      Over / Under 2.5
                    </span>
                    <span className="font-bold text-orange-500">
                      {selectedMatch.odds.over_2_5 ?? "-"} /{" "}
                      {selectedMatch.odds.under_2_5 ?? "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-[10px] text-muted-foreground block">
                      Asian Handicap Line
                    </span>
                    <span className="font-bold text-foreground">
                      {selectedMatch.odds.handicap ?? "-"} (
                      {selectedMatch.odds.handicap_home ?? "-"} /{" "}
                      {selectedMatch.odds.handicap_away ?? "-"})
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
                    if (onSelectTeamForAnalysis)
                      onSelectTeamForAnalysis(selectedMatch.home_team);
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
                    if (onSelectTeamForAnalysis)
                      onSelectTeamForAnalysis(selectedMatch.away_team);
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
