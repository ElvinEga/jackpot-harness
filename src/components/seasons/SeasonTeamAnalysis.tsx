import { TeamLogo } from "@/components/TeamLogo";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity } from "lucide-react";
import React, { useMemo, useState } from "react";
import type { SeasonMatch } from "../../lib/seasonTypes";
import {
  computeTeamProfile,
  getAllSeasonTeams,
} from "../../lib/seasonsAnalytics";
import { canonicalTeam } from "../../lib/teamRegistry";

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
  const activeTeam =
    (allTeams.includes(selectedTeam) ? selectedTeam : allTeams[0]) || "Arsenal";

  const [formLimit, setFormLimit] = useState<number>(10);

  const profile = useMemo(() => {
    return computeTeamProfile(matches, activeTeam, seasonName);
  }, [matches, activeTeam, seasonName]);

  if (!profile) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-border rounded-xl bg-card">
        No {activeTeam} matches in {seasonName}.
      </div>
    );
  }

  const displayedRecent = profile.recentMatches.slice(0, formLimit);

  return (
    <div className="space-y-6">
      {/* Distilled Team Command Header & Performance Matrix */}
      <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
        {/* Top Bar: Identity & Quick Switch */}
        <div className="px-4 py-3 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TeamLogo team={profile.team} size={30} />
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {profile.team}
              </h2>
              <Badge variant="outline" className="text-[11px]">
                {seasonName}
              </Badge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                ({profile.totalMatches} matches · {profile.winRate}% win rate)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground font-medium">
              Switch Team:
            </span>
            <SearchableSelect
              size="sm"
              value={activeTeam}
              onValueChange={onSelectTeam}
              options={allTeams.map((team) => ({
                value: team,
                label: team,
              }))}
              searchPlaceholder="Search club..."
              className="text-xs font-semibold h-8 min-w-44"
              popoverWidth="w-56"
            />
          </div>
        </div>

        {/* Primary Season Metrics Strip */}
        <div className="px-4 py-2.5 border-b border-border/70 bg-muted/20 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div>
            <span className="text-[11px] text-muted-foreground block">
              Matches
            </span>
            <span className="text-base font-bold text-foreground">
              {profile.totalMatches}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block">
              Record (W-D-L)
            </span>
            <span className="text-base font-bold">
              <span className="text-emerald-500">{profile.wins}W</span>{" "}
              <span className="text-amber-600 dark:text-amber-400">{profile.draws}D</span>{" "}
              <span className="text-destructive">{profile.losses}L</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block">
              Win Rate
            </span>
            <span className="text-base font-bold text-emerald-500">
              {profile.winRate}%
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block">
              Goals (F : A)
            </span>
            <span className="text-base font-bold text-foreground">
              {profile.goalsFor} : {profile.goalsAgainst}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({profile.avgGoalsFor}/m)
              </span>
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block">
              Power Ratings
            </span>
            <span className="text-base font-bold">
              <span className="text-emerald-500">{profile.attackRating}</span>
              <span className="text-muted-foreground font-normal">/</span>
              <span className="text-blue-500">
                {profile.defenseRating}
              </span>{" "}
              <span className="text-[10px] font-normal text-muted-foreground">
                ATK/DEF
              </span>
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block">
              Clean Sheets
            </span>
            <span className="text-base font-bold text-foreground">
              {profile.cleanSheets}{" "}
              <span className="text-xs font-normal text-emerald-500">
                ({profile.cleanSheetPct}%)
              </span>
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block">
              Both Teams Score
            </span>
            <span className="text-base font-bold text-foreground">
              {profile.bttsCount}{" "}
              <span className="text-xs font-normal text-primary">
                ({profile.bttsPct}%)
              </span>
            </span>
          </div>
        </div>

        {/* Detailed Splits & Secondary Disciplines */}
        <div className="px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-card">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {/* Home split */}
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-semibold text-foreground">Home:</span>
              <span className="text-muted-foreground">
                {profile.homeRecord.matches} MP
              </span>
              <span className="text-muted-foreground/60">·</span>
              <span className="font-medium text-foreground">
                {profile.homeRecord.wins}-{profile.homeRecord.draws}-
                {profile.homeRecord.losses}
              </span>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-muted-foreground">
                {profile.homeRecord.gf}-{profile.homeRecord.ga}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 border-emerald-500/30 text-emerald-500"
              >
                {profile.homeRecord.winRate}% W
              </Badge>
            </div>

            {/* Away split */}
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              <span className="font-semibold text-foreground">Away:</span>
              <span className="text-muted-foreground">
                {profile.awayRecord.matches} MP
              </span>
              <span className="text-muted-foreground/60">·</span>
              <span className="font-medium text-foreground">
                {profile.awayRecord.wins}-{profile.awayRecord.draws}-
                {profile.awayRecord.losses}
              </span>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-muted-foreground">
                {profile.awayRecord.gf}-{profile.awayRecord.ga}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 border-blue-500/30 text-blue-500"
              >
                {profile.awayRecord.winRate}% W
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground text-[11px] pt-1 md:pt-0 border-t md:border-t-0 border-border/50">
            <div>
              <span>SoT/90:</span>{" "}
              <strong className="text-foreground text-xs">
                {profile.avgShotsOnTarget}
              </strong>{" "}
              <span className="opacity-75">({profile.avgShots} total)</span>
            </div>
            <span className="text-border">|</span>
            <div>
              <span>Cards:</span>{" "}
              <strong className="text-foreground text-xs">
                {profile.avgYellows}
              </strong>{" "}
              <span className="text-amber-600 dark:text-amber-400 font-medium">YC</span> ·{" "}
              <strong className="text-foreground text-xs">
                {profile.avgReds}
              </strong>{" "}
              <span className="text-destructive font-medium">RC</span>
            </div>
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
                className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
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
                <TableHead className="text-center text-xs">
                  Shots (Target)
                </TableHead>
                <TableHead className="text-center text-xs">Corners</TableHead>
                <TableHead className="text-right text-xs">Odds</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRecent.map((m, i) => {
                const isHome =
                  canonicalTeam(m.home_team) === canonicalTeam(activeTeam);
                const opp = isHome ? m.away_team : m.home_team;
                const teamGoals = isHome ? m.home_goals : m.away_goals;
                const oppGoals = isHome ? m.away_goals : m.home_goals;

                const resLetter =
                  teamGoals > oppGoals
                    ? "W"
                    : teamGoals === oppGoals
                      ? "D"
                      : "L";
                const resColor =
                  resLetter === "W"
                    ? "bg-emerald-500"
                    : resLetter === "D"
                      ? "bg-amber-500"
                      : "bg-destructive";

                const shots = isHome ? m.stats.home_shots : m.stats.away_shots;
                const sot = isHome
                  ? m.stats.home_shots_on_target
                  : m.stats.away_shots_on_target;
                const corners = isHome
                  ? m.stats.home_corners
                  : m.stats.away_corners;

                const winOdds = isHome ? m.odds.home : m.odds.away;

                return (
                  <TableRow
                    key={i}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="tabular-nums text-xs text-muted-foreground">
                      {m.date}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {isHome ? "Home" : "Away"}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        <TeamLogo team={opp} size={16} />
                        <span>vs {opp}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-xs font-medium text-foreground">
                      {m.score}
                    </TableCell>
                    <TableCell className="text-center text-xs font-medium">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-bold text-white ${resColor}`}
                      >
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
