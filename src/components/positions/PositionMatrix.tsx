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
  Info,
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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

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
    <div className="flex-1 flex flex-col p-2 space-y-6  mx-auto w-full">
      {/* Title & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Position Analysis
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

      {/* Statistical Context Note on Score Modality */}
      <div className="p-3.5 bg-muted/40 border border-border rounded-xl flex items-start gap-3 text-xs leading-relaxed">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-foreground flex items-center gap-1.5">
            <span>Statistical Note: Why is 1-1 the overall top score across every row position?</span>
          </div>
          <p className="text-muted-foreground">
            In football jackpots, <strong className="text-foreground">Home Wins</strong> are the most frequent outcome (<span className="text-emerald-500 font-medium">~42%</span>), but they are dispersed across many different scorelines (1-0 at 10%, 2-1 at 8.5%, 2-0 at 5.9%, 3-1 at 3.4%). <strong className="text-foreground">Away Wins</strong> (<span className="text-blue-500 font-medium">~30%</span>) are similarly split (0-1 at 9%, 1-2 at 8%, 0-2 at 5.4%). In contrast, <strong className="text-foreground">Draws</strong> (<span className="text-amber-500 font-medium">~28%</span>) are heavily clustered into just two scores: <strong className="text-foreground">1-1 (~13.4%)</strong> and <strong className="text-foreground">0-0 (~9.1%)</strong>.
          </p>
          <p className="text-muted-foreground">
            Because nearly half of all draws finish 1-1, it is mathematically the single highest individual exact scoreline for every position unconditionally. Use the <strong className="text-foreground">Top Win (H / A)</strong> and color-coded <strong className="text-foreground">Frequent Scores</strong> columns below to see the dominant decisive victory scorelines for each row.
          </p>
        </div>
      </div>

      {/* Comprehensive Table of Positions */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Complete Metrics Matrix by Row Position
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Historical outcome rates and score distributions partitioned by jackpot position
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Analyzed {filteredMatches.length.toLocaleString()} total match rows
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 text-muted-foreground font-medium">
                <TableHead className="px-2 py-1 text-center w-12 text-xs">Row</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Matches</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Home Win %</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Draw %</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Away Win %</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Avg Goals (H - A)</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Over 2.5 %</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">BTTS %</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Top Score (All)</TableHead>
                <TableHead className="px-2 py-1 text-center text-xs">Top Win (H / A)</TableHead>
                <TableHead className="px-2 py-1 text-xs">Frequent Scores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((s) => (
                <TableRow key={s.position} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="px-2 py-1 text-center text-xs font-medium text-foreground">
                    #{s.position}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-muted-foreground">
                    {s.totalMatches.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-emerald-500">
                    {s.homeWinPct}%
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-amber-500">
                    {s.drawPct}%
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-blue-500">
                    {s.awayWinPct}%
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs">
                    <span className="font-medium text-foreground">{s.avgGoals}</span>
                    <span className="text-muted-foreground ml-1">
                      ({s.avgHomeGoals} - {s.avgAwayGoals})
                    </span>
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-muted-foreground">
                    {s.over25Pct}%
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-muted-foreground">
                    {s.bttsPct}%
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-amber-500" title={`Overall modal score: ${s.mostLikelyScore}`}>
                    {s.mostLikelyScore}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center tabular-nums text-xs">
                    <div className="flex items-center justify-center gap-1.5 font-medium">
                      {s.topHomeScore ? (
                        <span
                          className="text-emerald-500"
                          title={`Top Home Win Score: ${s.topHomeScore.score} (${s.topHomeScore.pct}%)`}
                        >
                          H: {s.topHomeScore.score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                      {s.topAwayScore ? (
                        <span
                          className="text-blue-500"
                          title={`Top Away Win Score: ${s.topAwayScore.score} (${s.topAwayScore.pct}%)`}
                        >
                          A: {s.topAwayScore.score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-2 py-1 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {s.topScores.slice(0, 4).map((ts) => {
                        const parts = ts.score.split("-").map(Number);
                        const isHome = parts[0] > parts[1];
                        const isDraw = parts[0] === parts[1];
                        const textColor = isHome
                          ? "text-emerald-500"
                          : isDraw
                          ? "text-amber-500"
                          : "text-blue-500";
                        return (
                          <span
                            key={ts.score}
                            className={`tabular-nums text-xs font-medium ${textColor}`}
                            title={`${ts.score}: ${ts.count} times (${ts.pct}%)`}
                          >
                            {ts.score} <span className="opacity-75 text-[10px]">({ts.pct}%)</span>
                          </span>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
