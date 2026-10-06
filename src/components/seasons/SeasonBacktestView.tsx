import React, { useState, useMemo } from "react";
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Percent,
  Award,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { SeasonMatch, BacktestSummary } from "../../lib/seasonTypes";
import { runSeasonBacktest } from "../../lib/seasonsBacktest";

interface SeasonBacktestViewProps {
  allMatches: SeasonMatch[];
}

export const SeasonBacktestView: React.FC<SeasonBacktestViewProps> = ({ allMatches }) => {
  // Extract distinct available seasons
  const availableSeasons = useMemo(() => {
    const set = new Set<string>();
    for (const m of allMatches) {
      if (m.season) set.add(m.season);
    }
    return Array.from(set).sort();
  }, [allMatches]);

  const [selectedTrain, setSelectedTrain] = useState<string[]>([
    "2021-2022",
    "2022-2023",
    "2023-2024",
  ]);
  const [selectedTest, setSelectedTest] = useState<string>("2024-2025");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestSummary | null>(() => {
    // Run an initial default simulation on 2024-2025 using prior 3 seasons
    if (allMatches.length > 0) {
      return runSeasonBacktest(
        allMatches,
        ["2021-2022", "2022-2023", "2023-2024"],
        "2024-2025"
      );
    }
    return null;
  });

  const handleToggleTrainSeason = (season: string) => {
    setSelectedTrain((prev) =>
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]
    );
  };

  const handleRunBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      try {
        const res = runSeasonBacktest(allMatches, selectedTrain, selectedTest);
        setResult(res);
      } finally {
        setIsRunning(false);
      }
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Configuration Card */}
      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Walk-Forward Model Backtest Simulator
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Train statistical parameters on past seasons and simulate predictions on an unseen season
              </p>
            </div>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleRunBacktest}
            disabled={isRunning || selectedTrain.length === 0 || !selectedTest}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isRunning ? "Simulating..." : "Run Backtest Simulation"}</span>
          </Button>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Training Seasons Checkboxes */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              1. Training Seasons (Historical Baseline):
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {availableSeasons.map((s) => {
                const isSelected = selectedTrain.includes(s);
                const isCurrentTest = selectedTest === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={isCurrentTest}
                    onClick={() => handleToggleTrainSeason(s)}
                    className={`px-2.5 py-1 rounded-md font-mono text-xs border transition-colors ${
                      isSelected
                        ? "bg-primary/15 text-primary border-primary/40 font-bold"
                        : "bg-muted text-muted-foreground border-border hover:text-foreground"
                    } ${isCurrentTest ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Season Dropdown */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              2. Test Season (Unseen Target):
            </label>
            <NativeSelect
              value={selectedTest}
              onChange={(e) => {
                const newTest = e.target.value;
                setSelectedTest(newTest);
                // Remove from training if selected
                setSelectedTrain((prev) => prev.filter((s) => s !== newTest));
              }}
              className="text-xs font-semibold h-8 w-48"
            >
              {availableSeasons.map((s) => (
                <NativeSelectOption key={s} value={s}>
                  {s}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* Results Scorecards */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card size="sm" className="bg-card border-border shadow-xs">
              <CardHeader className="pb-1">
                <CardDescription className="text-[11px]">Matches Evaluated</CardDescription>
                <CardTitle className="text-xl font-bold font-mono text-foreground">
                  {result.totalMatchesTested}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card size="sm" className="bg-card border-border shadow-xs">
              <CardHeader className="pb-1">
                <CardDescription className="text-[11px] text-emerald-500 font-medium">
                  1X2 Pick Accuracy
                </CardDescription>
                <CardTitle className="text-xl font-bold font-mono text-emerald-500">
                  {result.accuracy1X2Pct}%
                  <span className="text-[10px] text-muted-foreground font-normal ml-1 font-mono">
                    ({result.correct1X2}/{result.totalMatchesTested})
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card size="sm" className="bg-card border-border shadow-xs">
              <CardHeader className="pb-1">
                <CardDescription className="text-[11px] text-orange-500 font-medium">
                  Over / Under 2.5 Accuracy
                </CardDescription>
                <CardTitle className="text-xl font-bold font-mono text-orange-500">
                  {result.accuracyOver25Pct}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card size="sm" className="bg-card border-border shadow-xs">
              <CardHeader className="pb-1">
                <CardDescription className="text-[11px]">BTTS Accuracy</CardDescription>
                <CardTitle className="text-xl font-bold font-mono text-primary">
                  {result.accuracyBTTSPct}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card size="sm" className="bg-card border-border shadow-xs">
              <CardHeader className="pb-1">
                <CardDescription className="text-[11px]">Exact Score Hits</CardDescription>
                <CardTitle className="text-xl font-bold font-mono text-foreground">
                  {result.scoreAccuracyPct}%
                  <span className="text-[10px] text-muted-foreground font-normal ml-1 font-mono">
                    ({result.correctScores})
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card size="sm" className="bg-card border-border shadow-xs">
              <CardHeader className="pb-1">
                <CardDescription className="text-[11px]">Brier Score</CardDescription>
                <CardTitle className="text-xl font-bold font-mono text-blue-500" title="Multi-category Brier score. Closer to 0 indicates superior calibration.">
                  {result.brierScore}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Audit Fixture Table */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Prediction vs Actual Match Audit ({result.testSeason})
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Fixture by fixture evaluation with walk-forward pre-kickoff model calibration
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-semibold">
                {result.audits.length} Fixtures Logged
              </Badge>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur z-10">
                  <TableRow className="border-b border-border text-muted-foreground font-medium">
                    <TableHead className="px-2 py-1 text-xs">Date</TableHead>
                    <TableHead className="px-2 py-1 text-xs">Fixture</TableHead>
                    <TableHead className="px-2 py-1 text-center text-xs">Actual Score</TableHead>
                    <TableHead className="px-2 py-1 text-center text-xs">Predicted</TableHead>
                    <TableHead className="px-2 py-1 text-center text-xs">Exp Score</TableHead>
                    <TableHead className="px-2 py-1 text-center text-xs">1X2 Hit</TableHead>
                    <TableHead className="px-2 py-1 text-center text-xs">O/U Hit</TableHead>
                    <TableHead className="px-2 py-1 text-center text-xs">BTTS Hit</TableHead>
                    <TableHead className="px-2 py-1 text-right text-xs">Odds (H/D/A)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.audits.map((a, i) => (
                    <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="px-2 py-1 tabular-nums text-xs text-muted-foreground">{a.date}</TableCell>
                      <TableCell className="px-2 py-1 text-xs font-medium text-foreground">
                        {a.homeTeam} <span className="text-muted-foreground font-normal">vs</span> {a.awayTeam}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-center tabular-nums text-xs font-medium text-foreground">
                        {a.actualScore}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-center text-xs font-medium capitalize">
                        <span
                          className={
                            a.predictedResult === "home"
                              ? "text-emerald-500"
                              : a.predictedResult === "draw"
                              ? "text-amber-500"
                              : "text-primary"
                          }
                        >
                          {a.predictedResult}
                        </span>
                      </TableCell>
                      <TableCell className="px-2 py-1 text-center tabular-nums text-xs text-muted-foreground">
                        {a.predictedScore}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-center">
                        {a.isCorrect1X2 ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive/70 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-center">
                        {a.isCorrectOver25 ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive/70 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-center">
                        {a.isCorrectBTTS ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive/70 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="px-2 py-1 text-right tabular-nums text-xs text-muted-foreground">
                        {a.marketHomeOdds?.toFixed(2) || "-"} / {a.marketDrawOdds?.toFixed(2) || "-"} / {a.marketAwayOdds?.toFixed(2) || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
