import React, { useMemo } from "react";
import {
  TrendingUp,
  Calendar,
  Layers,
  Goal,
  Percent,
  Flame,
  Award,
  Clock,
} from "lucide-react";
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
import type { SeasonMatch } from "../../lib/seasonTypes";
import { computeSeasonComparison, computeCalendarAnalytics } from "../../lib/seasonsAnalytics";

interface SeasonTrendsProps {
  allMatches: SeasonMatch[];
}

export const SeasonTrends: React.FC<SeasonTrendsProps> = ({ allMatches }) => {
  const comparisons = useMemo(() => computeSeasonComparison(allMatches), [allMatches]);
  const calendar = useMemo(() => computeCalendarAnalytics(allMatches), [allMatches]);
  const leagueName = useMemo(() => {
    return allMatches[0]?.league?.replace(/.*–\s*/, "") || "League";
  }, [allMatches]);

  return (
    <div className="space-y-6">
      {/* Section 1: Season-to-Season Multi-Year Comparison */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              {leagueName} Evolution: Season-to-Season Comparison (2021–2027)
            </h3>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {comparisons.length} Seasons Evaluated
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-muted-foreground font-medium">
                <TableHead className="px-2 py-1 text-xs">Season</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Matches</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Goals / Match</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs text-emerald-500">Home Win %</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs text-amber-500">Draw %</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs text-blue-500">Away Win %</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs text-orange-500">Over 2.5 %</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">BTTS %</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Clean Sheet %</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Avg Shots</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Avg Corners</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Yellows / 90</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisons.map((row) => (
                <TableRow key={row.season} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="px-2 py-1 text-xs font-medium text-foreground">
                    {row.season}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-muted-foreground">{row.matches}</TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-primary">
                    {row.goalsPerMatch}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-emerald-500">
                    {row.homeWinPct}%
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-amber-500">
                    {row.drawPct}%
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-blue-500">
                    {row.awayWinPct}%
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-orange-500 font-medium">
                    {row.over25Pct}%
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-foreground">{row.bttsPct}%</TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-muted-foreground">{row.cleanSheetPct}%</TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-muted-foreground">{row.avgShotsPerMatch}</TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-muted-foreground">{row.avgCornersPerMatch}</TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-muted-foreground">{row.avgYellowsPerMatch}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section 2: Calendar Analytics (Monthly & Day-of-Week) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Breakdown Table */}
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">
                Monthly Performance &amp; Goal Patterns
              </h4>
            </div>
            <span className="text-[11px] text-muted-foreground">August to May</span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-muted-foreground font-medium">
                  <TableHead className="px-2 py-1 text-xs">Month</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs">Matches</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs">Avg Goals</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs text-emerald-500">Home %</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs text-amber-500">Draw %</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs text-blue-500">Away %</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs text-orange-500">Over 2.5 %</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs">BTTS %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calendar.monthly.map((m) => (
                  <TableRow key={m.monthNumber} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="px-2 py-1 text-xs font-medium text-foreground">
                      {m.monthName}
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-muted-foreground">{m.matches}</TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-primary">{m.avgGoals}</TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-emerald-500">
                      {m.homeWinPct}%
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-amber-500">
                      {m.drawPct}%
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-blue-500">
                      {m.awayWinPct}%
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-orange-500">
                      {m.over25Pct}%
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-foreground">{m.bttsPct}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Day of Week Breakdown Table */}
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">
                Day-of-Week Behavior &amp; Venue Bias
              </h4>
            </div>
            <span className="text-[11px] text-muted-foreground">Weekend vs Midweek</span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-muted-foreground font-medium">
                  <TableHead className="px-2 py-1 text-xs">Day</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs">Matches</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs">Avg Goals</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs text-emerald-500">Home %</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs text-amber-500">Draw %</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs text-blue-500">Away %</TableHead>
                  <TableHead className="px-2 py-1 text-center text-xs text-orange-500">Over 2.5 %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calendar.days.map((d) => (
                  <TableRow key={d.dayName} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="px-2 py-1 text-xs font-medium text-foreground">
                      {d.dayName}
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-muted-foreground">{d.matches}</TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-primary">{d.avgGoals}</TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-emerald-500">
                      {d.homeWinPct}%
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-amber-500">
                      {d.drawPct}%
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-blue-500">
                      {d.awayWinPct}%
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-orange-500">
                      {d.over25Pct}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};
