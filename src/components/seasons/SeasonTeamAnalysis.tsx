import React, { useState, useMemo } from "react";
import {
  Shield,
  Swords,
  Target,
  Goal,
  Flame,
  Award,
  ChevronRight,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { SeasonMatch } from "../../lib/seasonTypes";
import { getAllSeasonTeams, computeTeamProfile } from "../../lib/seasonsAnalytics";

interface SeasonTeamAnalysisProps {
  matches: SeasonMatch[];
  seasonName: string;
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  onPredictWithTeam?: (homeTeam: string, awayTeam: string) => void;
}

export const SeasonTeamAnalysis: React.FC<SeasonTeamAnalysisProps> = ({
  matches,
  seasonName,
  selectedTeam,
  onSelectTeam,
  onPredictWithTeam,
}) => {
  const allTeams = useMemo(() => getAllSeasonTeams(matches), [matches]);
  const activeTeam = (allTeams.includes(selectedTeam) ? selectedTeam : allTeams[0]) || "Arsenal";

  const [formLimit, setFormLimit] = useState<number>(10);

  const profile = useMemo(() => {
    return computeTeamProfile(matches, activeTeam, seasonName);
  }, [matches, activeTeam, seasonName]);

  if (!profile) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-border rounded-xl bg-card">
        No matches found for {activeTeam} in this season.
      </div>
    );
  }

  const displayedRecent = profile.recentMatches.slice(0, formLimit);

  return (
    <div className="space-y-6">
      {/* Team Selection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
            Team Deep Dive Analysis
          </span>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {profile.team}
            </h2>
            <Badge variant="outline" className="text-xs font-mono">
              {seasonName}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium shrink-0">Switch Team:</label>
          <SearchableSelect
            size="sm"
            value={activeTeam}
            onValueChange={onSelectTeam}
            options={allTeams.map((team) => ({
              value: team,
              label: team,
            }))}
            searchPlaceholder="Search club..."
            className="text-xs font-semibold h-9 min-w-48"
            popoverWidth="w-56"
          />
        </div>
      </div>

      {/* Ratings & Overall Record Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px]">Matches Played</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-foreground">
              {profile.totalMatches}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px]">Win / Draw / Loss</CardDescription>
            <CardTitle className="text-base font-bold font-mono text-foreground">
              <span className="text-emerald-500">{profile.wins}W</span>{" "}
              <span className="text-amber-500">{profile.draws}D</span>{" "}
              <span className="text-destructive">{profile.losses}L</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px]">Win Rate</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-emerald-500">
              {profile.winRate}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px]">Goals For / Against</CardDescription>
            <CardTitle className="text-base font-bold font-mono text-foreground">
              <span className="text-primary">{profile.goalsFor}</span> :{" "}
              <span className="text-muted-foreground">{profile.goalsAgainst}</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px]">Avg Goals Scored</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-primary">
              {profile.avgGoalsFor}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px]">Attack Rating</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-emerald-500">
              {profile.attackRating}/99
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px]">Defense Rating</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-blue-500">
              {profile.defenseRating}/99
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Home vs Away Splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Home Record */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Home Performance
            </span>
            <Badge variant="outline" className="text-xs font-mono font-semibold">
              {profile.homeRecord.winRate}% Win Rate
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">Home Matches</span>
              <span className="font-bold font-mono text-sm text-foreground">{profile.homeRecord.matches}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">Record (W-D-L)</span>
              <span className="font-bold font-mono text-sm text-foreground">
                {profile.homeRecord.wins}-{profile.homeRecord.draws}-{profile.homeRecord.losses}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">Goals (GF - GA)</span>
              <span className="font-bold font-mono text-sm text-foreground">
                {profile.homeRecord.gf} - {profile.homeRecord.ga}
              </span>
            </div>
          </div>
        </div>

        {/* Away Record */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Away Performance
            </span>
            <Badge variant="outline" className="text-xs font-mono font-semibold">
              {profile.awayRecord.winRate}% Win Rate
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">Away Matches</span>
              <span className="font-bold font-mono text-sm text-foreground">{profile.awayRecord.matches}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">Record (W-D-L)</span>
              <span className="font-bold font-mono text-sm text-foreground">
                {profile.awayRecord.wins}-{profile.awayRecord.draws}-{profile.awayRecord.losses}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30">
              <span className="text-muted-foreground block text-[11px]">Goals (GF - GA)</span>
              <span className="font-bold font-mono text-sm text-foreground">
                {profile.awayRecord.gf} - {profile.awayRecord.ga}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Underlying Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 border border-border rounded-xl p-3 text-xs">
        <div className="p-3 rounded-lg bg-card border border-border flex flex-col justify-between">
          <span className="text-muted-foreground text-[11px]">Clean Sheets</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono text-foreground">{profile.cleanSheets}</span>
            <span className="text-xs text-emerald-500 font-mono font-semibold">{profile.cleanSheetPct}%</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-card border border-border flex flex-col justify-between">
          <span className="text-muted-foreground text-[11px]">Both Teams To Score</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono text-foreground">{profile.bttsCount}</span>
            <span className="text-xs text-primary font-mono font-semibold">{profile.bttsPct}%</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-card border border-border flex flex-col justify-between">
          <span className="text-muted-foreground text-[11px]">Shots on Target / 90</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono text-foreground">{profile.avgShotsOnTarget}</span>
            <span className="text-[11px] text-muted-foreground font-mono">({profile.avgShots} total)</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-card border border-border flex flex-col justify-between">
          <span className="text-muted-foreground text-[11px]">Discipline (Yellow / Red)</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-lg font-bold font-mono text-foreground">
              {profile.avgYellows} <span className="text-xs font-normal text-muted-foreground">YC</span>
            </span>
            <span className="text-xs text-destructive font-mono font-semibold">
              {profile.avgReds} RC
            </span>
          </div>
        </div>
      </div>

      {/* Form Sequence & Recent Fixtures Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Recent Fixtures &amp; Performance Trail
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Show:</span>
            {[5, 10, 20].map((lim) => (
              <button
                key={lim}
                type="button"
                onClick={() => setFormLimit(lim)}
                className={`px-2 py-0.5 rounded text-xs font-mono font-semibold transition-colors ${
                  formLimit === lim
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {lim}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-muted-foreground font-medium">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Venue</TableHead>
                <TableHead className="text-xs">Opponent</TableHead>
                <TableHead className="text-center text-xs">Score</TableHead>
                <TableHead className="text-center text-xs">Result</TableHead>
                <TableHead className="text-center text-xs">Half-Time</TableHead>
                <TableHead className="text-center text-xs">Shots (Target)</TableHead>
                <TableHead className="text-center text-xs">Corners</TableHead>
                <TableHead className="text-right text-xs">Odds</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRecent.map((m, i) => {
                const isHome = m.home_team === activeTeam;
                const opp = isHome ? m.away_team : m.home_team;
                const teamGoals = isHome ? m.home_goals : m.away_goals;
                const oppGoals = isHome ? m.away_goals : m.home_goals;

                const resLetter =
                  teamGoals > oppGoals ? "W" : teamGoals === oppGoals ? "D" : "L";
                const resColor =
                  resLetter === "W"
                    ? "text-emerald-500"
                    : resLetter === "D"
                    ? "text-amber-500"
                    : "text-destructive";

                const shots = isHome ? m.stats.home_shots : m.stats.away_shots;
                const sot = isHome
                  ? m.stats.home_shots_on_target
                  : m.stats.away_shots_on_target;
                const corners = isHome ? m.stats.home_corners : m.stats.away_corners;

                const winOdds = isHome ? m.odds.home : m.odds.away;

                return (
                  <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="tabular-nums text-xs text-muted-foreground">{m.date}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {isHome ? "Home" : "Away"}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      vs {opp}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs font-medium text-foreground">
                      {m.score}
                    </TableCell>
                    <TableCell className="text-center text-xs font-medium">
                      <span className={resColor}>
                        {resLetter}
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {m.half_time_score || "-"}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {shots ?? "-"} ({sot ?? "-"})
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                      {corners ?? "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs font-medium text-foreground">
                      {winOdds ? winOdds.toFixed(2) : "-"}
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
