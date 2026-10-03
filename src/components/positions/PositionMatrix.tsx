import React, { useState, useMemo } from "react";
import {
  Layers,
  TrendingUp,
  Award,
  Flame,
  ShieldAlert,
  Percent,
  Goal,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

import type { Match, PositionStat } from "../../lib/types";
import { computePositionStats, getPositionAnomalies } from "../../lib/positions";
import { DATASETS } from "../../lib/data";

interface PositionMatrixProps {
  matches: Match[];
}

export const PositionMatrix: React.FC<PositionMatrixProps> = ({ matches }) => {
  const [selectedJackpot, setSelectedJackpot] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [maxPos, setMaxPos] = useState<number>(17);

  // Filter matches based on user selection
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedJackpot !== "all") {
        const [bm, jp] = selectedJackpot.split(" - ");
        if (m.bookmaker.toLowerCase() !== bm.toLowerCase() || m.jackpot.toLowerCase() !== jp.toLowerCase()) {
          return false;
        }
      }
      if (selectedYear !== "all") {
        if (!m.date || !m.date.startsWith(selectedYear)) return false;
      }
      return true;
    });
  }, [matches, selectedJackpot, selectedYear]);

  // Compute position stats 1..maxPos
  const stats: PositionStat[] = useMemo(() => {
    return computePositionStats(filteredMatches, maxPos);
  }, [filteredMatches, maxPos]);

  // Anomalies / Insights
  const anomalies = useMemo(() => {
    return getPositionAnomalies(stats);
  }, [stats]);

  // Chart data for 1X2 distribution
  const chartData1X2 = useMemo(() => {
    return stats.map((s) => ({
      name: `#${s.position}`,
      position: s.position,
      "Home Win %": s.homeWinPct,
      "Draw %": s.drawPct,
      "Away Win %": s.awayWinPct,
      avgGoals: s.avgGoals,
    }));
  }, [stats]);

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Position Analysis (1 to {maxPos})
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Discover historical outcome biases across jackpot events.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <NativeSelect
            value={selectedJackpot}
            onChange={(e) => setSelectedJackpot(e.target.value)}
            className="text-xs h-8 w-44"
          >
            <NativeSelectOption value="all">All Jackpots</NativeSelectOption>
            {DATASETS.map((d) => (
              <NativeSelectOption key={d.file} value={`${d.bookmaker} - ${d.jackpot}`}>
                {d.bookmaker.toUpperCase()}: {d.jackpot}
              </NativeSelectOption>
            ))}
          </NativeSelect>

          <NativeSelect
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs h-8 w-32"
          >
            <NativeSelectOption value="all">All Years</NativeSelectOption>
            <NativeSelectOption value="2026">2026</NativeSelectOption>
            <NativeSelectOption value="2025">2025</NativeSelectOption>
            <NativeSelectOption value="2024">2024</NativeSelectOption>
            <NativeSelectOption value="2023">2023</NativeSelectOption>
            <NativeSelectOption value="2022">2022</NativeSelectOption>
          </NativeSelect>

          <NativeSelect
            value={String(maxPos)}
            onChange={(e) => setMaxPos(Number(e.target.value))}
            className="text-xs h-8 w-28"
          >
            <NativeSelectOption value="15">15 Rows</NativeSelectOption>
            <NativeSelectOption value="16">16 Rows</NativeSelectOption>
            <NativeSelectOption value="17">17 Rows</NativeSelectOption>
            <NativeSelectOption value="20">20 Rows</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      {/* Anomalies / Key Insights Cards */}
      {anomalies && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card size="sm" className="bg-card border-border shadow-xs">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs flex items-center gap-1.5 text-primary">
                <Flame className="h-3.5 w-3.5" />
                Strongest Home Position
              </CardDescription>
              <CardTitle className="text-lg font-bold font-mono text-foreground flex items-center gap-2">
                <span>Position #{anomalies.highestHome.position}</span>
                <Badge variant="outline" className="text-primary border-primary/30 font-mono">
                  {anomalies.highestHome.homeWinPct}% Home
                </Badge>
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {anomalies.highestHome.homeWins} wins in {anomalies.highestHome.totalMatches} matches
              </span>
            </CardHeader>
          </Card>

          <Card size="sm" className="bg-card border-border shadow-xs">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs flex items-center gap-1.5 text-foreground">
                <ShieldAlert className="h-3.5 w-3.5" />
                Highest Draw Tendency
              </CardDescription>
              <CardTitle className="text-lg font-bold font-mono text-foreground flex items-center gap-2">
                <span>Position #{anomalies.highestDraw.position}</span>
                <Badge variant="outline" className="text-foreground border-border font-mono">
                  {anomalies.highestDraw.drawPct}% Draw
                </Badge>
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {anomalies.highestDraw.draws} draws in {anomalies.highestDraw.totalMatches} matches
              </span>
            </CardHeader>
          </Card>

          <Card size="sm" className="bg-card border-border shadow-xs">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Highest Away Win Rate
              </CardDescription>
              <CardTitle className="text-lg font-bold font-mono text-foreground flex items-center gap-2">
                <span>Position #{anomalies.highestAway.position}</span>
                <Badge variant="outline" className="text-muted-foreground border-primary/30 font-mono">
                  {anomalies.highestAway.awayWinPct}% Away
                </Badge>
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {anomalies.highestAway.awayWins} wins in {anomalies.highestAway.totalMatches} matches
              </span>
            </CardHeader>
          </Card>

          <Card size="sm" className="bg-card border-border shadow-xs">
            <CardHeader className="pb-1">
              <CardDescription className="text-xs flex items-center gap-1.5 text-primary">
                <Goal className="h-3.5 w-3.5" />
                Highest Scoring Position
              </CardDescription>
              <CardTitle className="text-lg font-bold font-mono text-foreground flex items-center gap-2">
                <span>Position #{anomalies.highestGoals.position}</span>
                <Badge variant="outline" className="text-primary border-primary/30 font-mono">
                  {anomalies.highestGoals.avgGoals} G/M
                </Badge>
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                Most frequent score: {anomalies.highestGoals.mostLikelyScore}
              </span>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Chart: 1X2 Percentage Distribution Across Positions 1..17 */}
      <Card className="bg-card border-border shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Percent className="h-4 w-4 text-primary" />
            1X2 Outcome Distribution by Jackpot Position (1 to {maxPos})
          </CardTitle>
          <CardDescription className="text-xs">
            Comparison of Home Win, Draw, and Away Win percentages across each row number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full" role="img" aria-label="Bar chart of home win, draw, and away win percentages for each jackpot position. The full-positions table below lists the same values.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData1X2} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 70]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [`${value}%`]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="Home Win %" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Draw %" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Away Win %" fill="#64748b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Table of Positions */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">
            Complete Metrics Matrix by Row Position
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            Analyzed {filteredMatches.length.toLocaleString()} total match rows
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                <th className="py-2.5 px-3 text-center w-14">Row</th>
                <th className="py-2.5 px-3 text-center">Matches</th>
                <th className="py-2.5 px-3 text-center">Home Win %</th>
                <th className="py-2.5 px-3 text-center">Draw %</th>
                <th className="py-2.5 px-3 text-center">Away Win %</th>
                <th className="py-2.5 px-3 text-center">Avg Goals (H - A)</th>
                <th className="py-2.5 px-3 text-center">Over 2.5 %</th>
                <th className="py-2.5 px-3 text-center">BTTS %</th>
                <th className="py-2.5 px-3 text-center">Top Score</th>
                <th className="py-2.5 px-3">Frequent Scores</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.map((s) => (
                <tr key={s.position} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted text-foreground font-bold font-mono text-xs border border-border">
                      #{s.position}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                    {s.totalMatches.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-medium text-primary">
                    {s.homeWinPct}%
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-medium text-foreground">
                    {s.drawPct}%
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-medium text-foreground">
                    {s.awayWinPct}%
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    <span className="font-semibold text-foreground">{s.avgGoals}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({s.avgHomeGoals} - {s.avgAwayGoals})
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                    {s.over25Pct}%
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-muted-foreground">
                    {s.bttsPct}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">
                      {s.mostLikelyScore}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {s.topScores.slice(0, 3).map((ts) => (
                        <span key={ts.score} className="text-xs font-mono px-1 rounded bg-muted text-muted-foreground">
                          {ts.score} ({ts.pct}%)
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
