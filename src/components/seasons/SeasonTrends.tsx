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
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Season</th>
                <th className="py-2.5 px-2 text-center">Matches</th>
                <th className="py-2.5 px-2 text-center">Goals / Match</th>
                <th className="py-2.5 px-2 text-center text-emerald-500">Home Win %</th>
                <th className="py-2.5 px-2 text-center text-amber-500">Draw %</th>
                <th className="py-2.5 px-2 text-center text-blue-500">Away Win %</th>
                <th className="py-2.5 px-2 text-center text-orange-500">Over 2.5 %</th>
                <th className="py-2.5 px-2 text-center">BTTS %</th>
                <th className="py-2.5 px-2 text-center">Clean Sheet %</th>
                <th className="py-2.5 px-2 text-center">Avg Shots</th>
                <th className="py-2.5 px-2 text-center">Avg Corners</th>
                <th className="py-2.5 px-2 text-center">Yellows / 90</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {comparisons.map((row) => (
                <tr key={row.season} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-bold text-foreground">
                    {row.season}
                  </td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground">{row.matches}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-primary">
                    {row.goalsPerMatch}
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-emerald-500">
                    {row.homeWinPct}%
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-amber-500">
                    {row.drawPct}%
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-blue-500">
                    {row.awayWinPct}%
                  </td>
                  <td className="py-2.5 px-2 text-center text-orange-500 font-semibold">
                    {row.over25Pct}%
                  </td>
                  <td className="py-2.5 px-2 text-center text-foreground">{row.bttsPct}%</td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground">{row.cleanSheetPct}%</td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground">{row.avgShotsPerMatch}</td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground">{row.avgCornersPerMatch}</td>
                  <td className="py-2.5 px-2 text-center text-muted-foreground">{row.avgYellowsPerMatch}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                  <th className="py-2 px-3">Month</th>
                  <th className="py-2 px-2 text-center">Matches</th>
                  <th className="py-2 px-2 text-center">Avg Goals</th>
                  <th className="py-2 px-2 text-center text-emerald-500">Home %</th>
                  <th className="py-2 px-2 text-center text-amber-500">Draw %</th>
                  <th className="py-2 px-2 text-center text-blue-500">Away %</th>
                  <th className="py-2 px-2 text-center text-orange-500">Over 2.5 %</th>
                  <th className="py-2 px-2 text-center">BTTS %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {calendar.monthly.map((m) => (
                  <tr key={m.monthNumber} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2 px-3 font-sans font-semibold text-foreground">
                      {m.monthName}
                    </td>
                    <td className="py-2 px-2 text-center text-muted-foreground">{m.matches}</td>
                    <td className="py-2 px-2 text-center font-bold text-primary">{m.avgGoals}</td>
                    <td className="py-2 px-2 text-center font-medium text-emerald-500">
                      {m.homeWinPct}%
                    </td>
                    <td className="py-2 px-2 text-center font-medium text-amber-500">
                      {m.drawPct}%
                    </td>
                    <td className="py-2 px-2 text-center font-medium text-blue-500">
                      {m.awayWinPct}%
                    </td>
                    <td className="py-2 px-2 text-center font-medium text-orange-500">
                      {m.over25Pct}%
                    </td>
                    <td className="py-2 px-2 text-center text-foreground">{m.bttsPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                  <th className="py-2 px-3">Day</th>
                  <th className="py-2 px-2 text-center">Matches</th>
                  <th className="py-2 px-2 text-center">Avg Goals</th>
                  <th className="py-2 px-2 text-center text-emerald-500">Home %</th>
                  <th className="py-2 px-2 text-center text-amber-500">Draw %</th>
                  <th className="py-2 px-2 text-center text-blue-500">Away %</th>
                  <th className="py-2 px-2 text-center text-orange-500">Over 2.5 %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {calendar.days.map((d) => (
                  <tr key={d.dayName} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2 px-3 font-sans font-semibold text-foreground">
                      {d.dayName}
                    </td>
                    <td className="py-2 px-2 text-center text-muted-foreground">{d.matches}</td>
                    <td className="py-2 px-2 text-center font-bold text-primary">{d.avgGoals}</td>
                    <td className="py-2 px-2 text-center font-medium text-emerald-500">
                      {d.homeWinPct}%
                    </td>
                    <td className="py-2 px-2 text-center font-medium text-amber-500">
                      {d.drawPct}%
                    </td>
                    <td className="py-2 px-2 text-center font-medium text-blue-500">
                      {d.awayWinPct}%
                    </td>
                    <td className="py-2 px-2 text-center font-medium text-orange-500">
                      {d.over25Pct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
