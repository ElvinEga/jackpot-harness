import React, { useState, useMemo } from "react";
import {
  AlertTriangle,
  Layers,
  PieChart as PieChartIcon,
  TrendingUp,
  Target,
  ShieldAlert,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import type { Match } from "../../lib/types";
import {
  deduplicateMatches,
  getResultDistribution,
  getBookmakerStats,
  getGoalsStats,
  getOddsBandStats,
  getTimelineStats,
  getCoverageStats,
} from "../../lib/analytics";

interface AnalyticsViewProps {
  matches: Match[];
}

const RESULT_COLORS: Record<string, string> = {
  "Home Win": "#10b981", // emerald
  "Draw": "#f59e0b",     // amber
  "Away Win": "#38bdf8", // cyan/sky
  "Postp / Abn": "#a855f7", // purple
  "Other / Unknown": "#64748b", // slate
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ matches }) => {
  const [dedupMozzart, setDedupMozzart] = useState(true);

  // Apply deduplication if enabled
  const analyzedMatches = useMemo(() => {
    return dedupMozzart ? deduplicateMatches(matches, true) : matches;
  }, [matches, dedupMozzart]);

  // Compute analytics metrics
  const resultsDist = useMemo(() => getResultDistribution(analyzedMatches), [analyzedMatches]);
  const bookmakerStats = useMemo(() => getBookmakerStats(analyzedMatches), [analyzedMatches]);
  const goalsStats = useMemo(() => getGoalsStats(analyzedMatches), [analyzedMatches]);
  const oddsBandStats = useMemo(() => getOddsBandStats(analyzedMatches), [analyzedMatches]);
  const timelineStats = useMemo(() => getTimelineStats(analyzedMatches), [analyzedMatches]);
  const coverageStats = useMemo(() => getCoverageStats(analyzedMatches), [analyzedMatches]);

  const total = analyzedMatches.length || 1;
  const homeRate = (resultsDist.find((r) => r.name === "Home Win")?.count || 0) / total * 100;
  const drawRate = (resultsDist.find((r) => r.name === "Draw")?.count || 0) / total * 100;
  const awayRate = (resultsDist.find((r) => r.name === "Away Win")?.count || 0) / total * 100;

  const tooltipStyle = {
    backgroundColor: "var(--popover)",
    borderColor: "var(--border)",
    color: "var(--popover-foreground)",
    borderRadius: "8px",
    fontSize: "12px",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)",
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 space-y-6">
      {/* 1. Market Caveat Warning Banner */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-amber-200 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs leading-relaxed">
          <div className="flex items-center gap-2">
            <strong className="text-sm font-semibold text-amber-300">
              Crucial Market Caveat: Interleaved 1X2 & Double Chance Odds
            </strong>
            <Badge variant="outline" className="border-amber-600/50 text-amber-300 text-[10px]">
              Schema Limitation
            </Badge>
          </div>
          <p>
            The raw bookmaker scrape omits market type (FT 1X2 vs Double Chance DC) and tipster pick (1, X, 2, 1X, 12, X2).
            Consequently, decimal odds cannot be interpreted as a homogeneous 1X2 price — a 1.35 odds could represent a full-time away win or a heavy double chance favorite.
            Always analyze odds segmented by price bands rather than implied probabilities.
          </p>
        </div>
      </div>

      {/* 2. Top Controls & KPI Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card/60 border border-border p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={dedupMozzart}
              onChange={(e) => setDedupMozzart(e.target.checked)}
              className="rounded border-border bg-background text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            <span>Deduplicate overlapping Mozzart extract batches</span>
          </label>
          <span className="text-[11px] text-muted-foreground hidden md:inline">
            (Deduplicates on date + home team + away team across mozzart files)
          </span>
        </div>

        <div className="text-xs text-muted-foreground">
          Sample size: <strong className="text-foreground">{analyzedMatches.length.toLocaleString()}</strong> matches
          {dedupMozzart && matches.length !== analyzedMatches.length && (
            <span className="text-muted-foreground/80 ml-1">
              ({(matches.length - analyzedMatches.length).toLocaleString()} overlaps pruned)
            </span>
          )}
        </div>
      </div>

      {/* 3. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-card/40 border-border">
          <CardContent className="p-3">
            <span className="text-[11px] font-medium text-muted-foreground">Analyzed Matches</span>
            <div className="text-xl font-bold text-foreground mt-1">
              {analyzedMatches.length.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-950/20 border-emerald-900/40">
          <CardContent className="p-3">
            <span className="text-[11px] font-medium text-emerald-400">Home Win Rate</span>
            <div className="text-xl font-bold text-emerald-300 mt-1">
              {homeRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-950/20 border-amber-900/40">
          <CardContent className="p-3">
            <span className="text-[11px] font-medium text-amber-400">Draw Rate</span>
            <div className="text-xl font-bold text-amber-300 mt-1">
              {drawRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sky-950/20 border-sky-900/40">
          <CardContent className="p-3">
            <span className="text-[11px] font-medium text-sky-400">Away Win Rate</span>
            <div className="text-xl font-bold text-sky-300 mt-1">
              {awayRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border">
          <CardContent className="p-3">
            <span className="text-[11px] font-medium text-muted-foreground">Avg Goals / Match</span>
            <div className="text-xl font-bold text-foreground mt-1">
              {goalsStats.avgGoals.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-950/20 border-purple-900/40">
          <CardContent className="p-3">
            <span className="text-[11px] font-medium text-purple-400">Over 2.5 Goals</span>
            <div className="text-xl font-bold text-purple-300 mt-1">
              {goalsStats.over25Rate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Results Distribution & Bookmaker Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Results Pie Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              <CardTitle>Result Outcomes Distribution</CardTitle>
            </div>
            <CardDescription>
              Overall outcome proportion for all matching records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultsDist}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${(Number(percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {resultsDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RESULT_COLORS[entry.name] || "#38bdf8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [Number(val || 0).toLocaleString() + " matches", "Count"]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate by Bookmaker */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <CardTitle>Outcome Rates by Bookmaker</CardTitle>
            </div>
            <CardDescription>
              Comparative home, draw, and away rates across Betika, Mozzart, and SportPesa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bookmakerStats.map((b) => ({
                    bookmaker: b.bookmaker.charAt(0).toUpperCase() + b.bookmaker.slice(1),
                    Home: parseFloat(b.homeRate.toFixed(1)),
                    Draw: parseFloat(b.drawRate.toFixed(1)),
                    Away: parseFloat(b.awayRate.toFixed(1)),
                  }))}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="bookmaker" stroke="#94a3b8" fontSize={11} />
                  <YAxis unit="%" stroke="#94a3b8" fontSize={11} domain={[0, 60]} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [`${val}%`, ""]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="Home" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Draw" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Away" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Goals Breakdown & Top Exact Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Exact Scores Histogram */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-400" />
              <CardTitle>Top 10 Most Common Final Scores</CardTitle>
            </div>
            <CardDescription>
              Exact scoreline frequency across completed football matches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={goalsStats.exactScores}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="score" type="category" stroke="#94a3b8" fontSize={11} width={40} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any, _name: any, props: any) => [
                      `${Number(val || 0).toLocaleString()} matches (${(props?.payload?.percentage || 0).toFixed(1)}%)`,
                      "Frequency",
                    ]}
                  />
                  <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Goals Distribution Histogram */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <CardTitle>Total Match Goals Distribution</CardTitle>
            </div>
            <CardDescription>
              Count of matches by aggregate goals scored (Over 1.5: {goalsStats.over15Rate.toFixed(1)}%, Over 2.5: {goalsStats.over25Rate.toFixed(1)}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={goalsStats.goalHistogram}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="goals" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [Number(val || 0).toLocaleString() + " matches", "Frequency"]}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6. Odds Band Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-400" />
                <CardTitle>Match Volume & Outcomes by Odds Band</CardTitle>
              </div>
              <CardDescription>
                Stratified price-band breakdown to handle interleaved markets without bias
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={oddsBandStats}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="band" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any, name: any) => [
                    `${Number(val || 0).toLocaleString()} matches`,
                    name === "homeCount" ? "Home Win" : name === "drawCount" ? "Draw" : "Away Win",
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  formatter={(value: string) =>
                    value === "homeCount" ? "Home Win" : value === "drawCount" ? "Draw" : "Away Win"
                  }
                />
                <Bar dataKey="homeCount" fill="#10b981" stackId="a" />
                <Bar dataKey="drawCount" fill="#f59e0b" stackId="a" />
                <Bar dataKey="awayCount" fill="#38bdf8" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 7. Coverage Timeline & Data Health Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <CardTitle>Jackpot Archive Timeline</CardTitle>
            </div>
            <CardDescription>
              Volume of jackpot matches scraped per year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timelineStats}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any) => [Number(val || 0).toLocaleString() + " matches", "Volume"]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="betika" name="Betika" fill="#10b981" stackId="b" />
                  <Bar dataKey="mozzart" name="Mozzart" fill="#eab308" stackId="b" />
                  <Bar dataKey="sportpesa" name="SportPesa" fill="#6366f1" stackId="b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Data Completeness & Health Audit */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <CardTitle>Dataset Health & Completeness Audit</CardTitle>
            </div>
            <CardDescription>
              Overview of missing values, anomalies and postponed matches in current view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border">
                <span className="text-foreground">Total Records</span>
                <span className="font-mono font-bold text-foreground">
                  {coverageStats.total.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border">
                <span className="text-foreground">Missing Dates</span>
                <span className="font-mono font-bold text-amber-400">
                  {coverageStats.missingDate.toLocaleString()}
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ({((coverageStats.missingDate / total) * 100).toFixed(2)}%)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border">
                <span className="text-foreground">Null Odds Records</span>
                <span className="font-mono font-bold text-amber-400">
                  {coverageStats.missingOdds.toLocaleString()}
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ({((coverageStats.missingOdds / total) * 100).toFixed(2)}%)
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border">
                <span className="text-foreground">Postponed / Abandoned Matches</span>
                <span className="font-mono font-bold text-purple-400">
                  {coverageStats.postponedOrAbandoned.toLocaleString()}
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ({((coverageStats.postponedOrAbandoned / total) * 100).toFixed(2)}%)
                  </span>
                </span>
              </div>

              {/* Top featured teams pill cloud */}
              <div className="pt-2">
                <span className="text-muted-foreground block mb-2 font-medium">
                  Top 5 Most Featured Teams in Jackpots:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {coverageStats.topTeams.slice(0, 5).map((team) => (
                    <Badge key={team.name} variant="secondary">
                      {team.name} ({team.count})
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
