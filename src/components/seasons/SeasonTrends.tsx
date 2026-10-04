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

  return (
    <div className="space-y-6">
      {/* Section 1: Season-to-Season Multi-Year Comparison */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Premier League Evolution: Season-to-Season Comparison (2021–2027)
            </h3>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {comparisons.length} Seasons Evaluated
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-muted-foreground font-semibold">
                <TableHead className="py-2.5 px-3">Season</TableHead>
                <TableHead className="py-2.5 px-2 text-center">Matches</TableHead>
                <TableHead className="py-2.5 px-2 text-center">Goals / Match</TableHead>
                <TableHead className="py-2.5 px-2 text-center text-emerald-500">Home Win %</TableHead>
                <TableHead className="py-2.5 px-2 text-center text-amber-500">Draw %</TableHead>
                <TableHead className="py-2.5 px-2 text-center text-blue-500">Away Win %</TableHead>
                <TableHead className="py-2.5 px-2 text-center text-orange-500">Over 2.5 %</TableHead>
                <TableHead className="py-2.5 px-2 text-center">BTTS %</TableHead>
                <TableHead className="py-2.5 px-2 text-center">Clean Sheet %</TableHead>
                <TableHead className="py-2.5 px-2 text-center">Avg Shots</TableHead>
                <TableHead className="py-2.5 px-2 text-center">Avg Corners</TableHead>
                <TableHead className="py-2.5 px-2 text-center">Yellows / 90</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono">
              {comparisons.map((row) => (
                <TableRow key={row.season} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="py-2.5 px-3 font-sans font-bold text-foreground">
                    {row.season}
                  </TableCell>
                  <TableCell className="py-2.5 px-2 text-center text-muted-foreground">{row.matches}</TableCell>
                  <TableCell className="py-2.5 px-2 text-center font-bold text-primary">
                    {row.goalsPerMatch}
                  </TableCell>
                  <TableCell className="py-2.5 px-2 text-center font-semibold text-emerald-500">
                    {row.homeWinPct}%
                  </TableCell>
                  <TableCell className="py-2.5 px-2 text-center font-semibold text-amber-500">
                    {row.drawPct}%
                  </TableCell>
                  <TableCell className="py-2.5 px-2 text-center font-semibold text-blue-500">
                    {row.awayWinPct}%
                  </TableCell>
                  <TableCell className="py-2.5 px-2 text-center text-orange-500 font-semibold">
                    {row.over25Pct}%
                  </TableCell>
                  <TableCell className="py-2.5 px-2 text-center text-foreground">{row.bttsPct}%</TableCell>
                  <TableCell className="py-2.5 px-2 text-center text-muted-foreground">{row.cleanSheetPct}%</TableCell>
                  <TableCell className="py-2.5 px-2 text-center text-muted-foreground">{row.avgShotsPerMatch}</TableCell>
                  <TableCell className="py-2.5 px-2 text-center text-muted-foreground">{row.avgCornersPerMatch}</TableCell>
                  <TableCell className="py-2.5 px-2 text-center text-muted-foreground">{row.avgYellowsPerMatch}</TableCell>
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
                <TableRow className="bg-muted/50 text-muted-foreground font-semibold">
                  <TableHead className="py-2 px-3">Month</TableHead>
                  <TableHead className="py-2 px-2 text-center">Matches</TableHead>
                  <TableHead className="py-2 px-2 text-center">Avg Goals</TableHead>
                  <TableHead className="py-2 px-2 text-center text-emerald-500">Home %</TableHead>
                  <TableHead className="py-2 px-2 text-center text-amber-500">Draw %</TableHead>
                  <TableHead className="py-2 px-2 text-center text-blue-500">Away %</TableHead>
                  <TableHead className="py-2 px-2 text-center text-orange-500">Over 2.5 %</TableHead>
                  <TableHead className="py-2 px-2 text-center">BTTS %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono">
                {calendar.monthly.map((m) => (
                  <TableRow key={m.monthNumber} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="py-2 px-3 font-sans font-semibold text-foreground">
                      {m.monthName}
                    </TableCell>
                    <TableCell className="py-2 px-2 text-center text-muted-foreground">{m.matches}</TableCell>
                    <TableCell className="py-2 px-2 text-center font-bold text-primary">{m.avgGoals}</TableCell>
                    <TableCell className="py-2 px-2 text-center font-medium text-emerald-500">
                      {m.homeWinPct}%
                    </TableCell>
                    <TableCell className="py-2 px-2 text-center font-medium text-amber-500">
                      {m.drawPct}%
                    </TableCell>
                    <TableCell className="py-2 px-2 text-center font-medium text-blue-500">
                      {m.awayWinPct}%
                    </TableCell>
                    <TableCell className="py-2 px-2 text-center font-medium text-orange-500">
                      {m.over25Pct}%
                    </TableCell>
                    <TableCell className="py-2 px-2 text-center text-foreground">{m.bttsPct}%</TableCell>
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
                <TableRow className="bg-muted/50 text-muted-foreground font-semibold">
                  <TableHead className="py-2 px-3">Day</TableHead>
                  <TableHead className="py-2 px-2 text-center">Matches</TableHead>
                  <TableHead className="py-2 px-2 text-center">Avg Goals</TableHead>
                  <TableHead className="py-2 px-2 text-center text-emerald-500">Home %</TableHead>
                  <TableHead className="py-2 px-2 text-center text-amber-500">Draw %</TableHead>
                  <TableHead className="py-2 px-2 text-center text-blue-500">Away %</TableHead>
                  <TableHead className="py-2 px-2 text-center text-orange-500">Over 2.5 %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono">
                {calendar.days.map((d) => (
                  <TableRow key={d.dayName} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="py-2 px-3 font-sans font-semibold text-foreground">
                      {d.dayName}
                    </TableCell>
                    <TableCell className="py-2 px-2 text-center text-muted-foreground">{d.matches}</TableCell>
                    <TableCell className="py-2 px-2 text-center font-bold text-primary">{d.avgGoals}</TableCell>
                    <TableCell className="py-2 px-2 text-center font-medium text-emerald-500">
                      {d.homeWinPct}%
                    </TableCell>
                    <TableCell className="py-2 px-2 text-center font-medium text-amber-500">
                      {d.drawPct}%
                    </TableCell>
                    <TableCell className="py-2 px-2 text-center font-medium text-blue-500">
                      {d.awayWinPct}%
                    </TableCell>
                    <TableCell className="py-2 px-2 text-center font-medium text-orange-500">
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
