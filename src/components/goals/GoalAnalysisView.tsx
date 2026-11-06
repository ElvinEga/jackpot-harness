import React, { useMemo } from "react";
import {
  Goal,
  Calendar,
  CalendarDays,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import type { Match, MonthGoalStat, DayGoalStat } from "../../lib/types";
import { computeMonthlyGoalStats, computeDailyGoalStats, computeScoreDistribution } from "../../lib/goals";

interface GoalAnalysisViewProps {
  matches: Match[];
}

export const GoalAnalysisView: React.FC<GoalAnalysisViewProps> = ({ matches }) => {
  const monthlyStats: MonthGoalStat[] = useMemo(() => {
    return computeMonthlyGoalStats(matches);
  }, [matches]);

  const dailyStats: DayGoalStat[] = useMemo(() => {
    return computeDailyGoalStats(matches);
  }, [matches]);

  const scoreDist = useMemo(() => {
    return computeScoreDistribution(matches, 12);
  }, [matches]);

  // Overall Goal Metrics
  const overall = useMemo(() => {
    let totalGoals = 0;
    let homeGoals = 0;
    let awayGoals = 0;
    let scoredMatches = 0;
    let over15 = 0;
    let over25 = 0;
    let btts = 0;

    for (const m of matches) {
      if (m.home_goals !== null && m.away_goals !== null && m.total_goals !== null) {
        scoredMatches++;
        totalGoals += m.total_goals;
        homeGoals += m.home_goals;
        awayGoals += m.away_goals;
        if (m.total_goals > 1.5) over15++;
        if (m.total_goals > 2.5) over25++;
        if (m.home_goals > 0 && m.away_goals > 0) btts++;
      }
    }

    const count = scoredMatches || 1;
    return {
      scoredMatches,
      avgGoals: Number((totalGoals / count).toFixed(2)),
      avgHomeGoals: Number((homeGoals / count).toFixed(2)),
      avgAwayGoals: Number((awayGoals / count).toFixed(2)),
      over15Pct: Number(((over15 / count) * 100).toFixed(1)),
      over25Pct: Number(((over25 / count) * 100).toFixed(1)),
      bttsPct: Number(((btts / count) * 100).toFixed(1)),
    };
  }, [matches]);

  return (
    <div className="flex-1 flex flex-col p-2 space-y-6  mx-auto w-full">
      {/* Distilled Goal Analytics Command Header */}
      <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Goal className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Goal &amp; Score Frequency Analytics
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Monthly and day-of-week averages across {overall.scoredMatches.toLocaleString()} analyzed fixtures
              </p>
            </div>
          </div>
        </div>

        {/* Quantitative Metrics Bar */}
        <div className="px-4 py-2.5 bg-muted/20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs items-center">
          <div>
            <span className="text-[10px] text-muted-foreground block">Overall Avg Goals</span>
            <span className="text-sm font-bold text-foreground">{overall.avgGoals}</span>
            <span className="text-[10px] text-muted-foreground ml-1">/ match</span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground block">Home vs Away Avg</span>
            <span className="text-sm font-bold text-foreground">
              <span className="text-emerald-500">{overall.avgHomeGoals}</span>
              <span className="text-muted-foreground font-normal"> / </span>
              <span className="text-blue-500">{overall.avgAwayGoals}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground block">Over 1.5 Goals</span>
            <span className="text-sm font-bold text-foreground">{overall.over15Pct}%</span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground block">Over 2.5 Goals</span>
            <span className="text-sm font-bold text-orange-500">{overall.over25Pct}%</span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground block">BTTS (Both Scored)</span>
            <span className="text-sm font-bold text-emerald-500">{overall.bttsPct}%</span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground block">Analyzed Fixtures</span>
            <span className="text-sm font-bold text-foreground">{overall.scoredMatches.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Grid: Goals by Month & Goals by Day of Week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Month Chart */}
        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Average Goals by Month (Jan – Dec)
            </CardTitle>
            <CardDescription className="text-xs">
              Average goals and over-2.5 rates for each month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full" role="img" aria-label="Chart of average goals per match and over 2.5 percent by calendar month.">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyStats} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="monthName" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(v) => v.slice(0, 3)} />
                  <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={10} domain={[1.8, 3.0]} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={10} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                  <Bar yAxisId="left" dataKey="avgGoals" name="Avg Goals" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="over25Pct" name="Over 2.5 %" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Day of Week Chart */}
        <Card className="bg-card border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Average Goals by Day of Week
            </CardTitle>
            <CardDescription className="text-xs">
              Average goals per match for each day of the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full" role="img" aria-label="Bar chart of average goals per match by day of week.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="dayName" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} domain={[1.8, 3.0]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="avgGoals" name="Avg Goals / Match" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Exact Scores Breakdown */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">
            Most Frequent Exact Scores Across Jackpot Archives
          </h2>
          <span className="text-xs text-muted-foreground">
            {overall.scoredMatches.toLocaleString()} scored matches analyzed
          </span>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {scoreDist.topScores.map((sc, i) => (
              <div key={sc.score} className="p-2 rounded-lg border border-border bg-muted/20 text-center">
                <span className="text-[10px] text-muted-foreground block">Rank #{i + 1}</span>
                <span className="text-base font-bold text-foreground block mt-0.5">{sc.score}</span>
                <span className="text-xs font-medium text-primary block">{sc.pct}%</span>
                <span className="text-[10px] text-muted-foreground block">
                  {sc.count.toLocaleString()} times
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
