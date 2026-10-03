import React, { useMemo } from "react";
import {
  Goal,
  Calendar,
  CalendarDays,
  Target,
  BarChart3,
  TrendingUp,
  Percent,
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
import { Badge } from "@/components/ui/badge";

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
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Goal & Score Frequency Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Historical goal averages analyzed across distribution profiles.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs flex items-center gap-1">
              <Goal className="h-3 w-3 text-primary" />
              Overall Avg Goals
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-primary">
              {overall.avgGoals}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs flex items-center gap-1">
              <Target className="h-3 w-3 text-primary" />
              Avg Home Goals
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-primary">
              {overall.avgHomeGoals}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs flex items-center gap-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              Avg Away Goals
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-foreground">
              {overall.avgAwayGoals}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs">Over 1.5 Goals %</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-foreground">
              {overall.over15Pct}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs">Over 2.5 Goals %</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-foreground">
              {overall.over25Pct}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs">BTTS (Both Score)</CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-foreground">
              {overall.bttsPct}%
            </CardTitle>
          </CardHeader>
        </Card>
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
              Seasonal goal performance and scoring trends across the calendar year
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
                  <Line yAxisId="right" type="monotone" dataKey="over25Pct" name="Over 2.5 %" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
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
              Comparison between weekend jackpot action and midweek fixtures
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
          <span className="text-xs text-muted-foreground font-mono">
            {overall.scoredMatches.toLocaleString()} scored matches analyzed
          </span>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {scoreDist.topScores.map((sc, i) => (
              <div key={sc.score} className="p-3 rounded-lg border border-border bg-muted/20 text-center">
                <span className="text-xs text-muted-foreground block">Rank #{i + 1}</span>
                <span className="text-lg font-bold font-mono text-foreground block mt-0.5">{sc.score}</span>
                <span className="text-xs font-mono font-medium text-primary block mt-0.5">{sc.pct}%</span>
                <span className="text-xs text-muted-foreground font-mono">
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
