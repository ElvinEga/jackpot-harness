import React, { useState, useMemo } from "react";
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
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
import { TeamLogo } from "@/components/TeamLogo";

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
      {/* Distilled Backtest Command & Results Panel */}
      <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
        {/* Top Control Bar: Config & Simulation Action */}
        <div className="px-4 py-3 border-b border-border bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            {/* Title / Icon */}
            <div className="flex items-center gap-2 shrink-0">
              <FlaskConical className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">Backtest Simulator</span>
            </div>

            {/* Training Seasons Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-medium shrink-0">Training Baseline:</span>
              {availableSeasons.map((s) => {
                const isSelected = selectedTrain.includes(s);
                const isCurrentTest = selectedTest === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={isCurrentTest}
                    onClick={() => handleToggleTrainSeason(s)}
                    className={`px-2 py-0.5 rounded text-[11px] border transition-colors ${
                      isSelected
                        ? "bg-primary/15 text-primary border-primary/40 font-bold"
                        : "bg-muted/50 text-muted-foreground border-border hover:text-foreground"
                    } ${isCurrentTest ? "opacity-35 cursor-not-allowed" : ""}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            {/* Test Target Season */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-muted-foreground font-medium shrink-0">Target Season:</span>
              <NativeSelect
                value={selectedTest}
                onChange={(e) => {
                  const newTest = e.target.value;
                  setSelectedTest(newTest);
                  setSelectedTrain((prev) => prev.filter((s) => s !== newTest));
                }}
                className="text-xs font-semibold h-7.5 w-36"
              >
                {availableSeasons.map((s) => (
                  <NativeSelectOption key={s} value={s}>
                    {s}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleRunBacktest}
            disabled={isRunning || selectedTrain.length === 0 || !selectedTest}
            className="h-8 text-xs font-semibold gap-1.5 shrink-0"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isRunning ? "Evaluating Model..." : "Run Backtest Simulation"}</span>
          </Button>
        </div>

        {/* Results Strip */}
        {result && (
          <div className="px-4 py-2.5 bg-muted/20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs items-center">
            <div>
              <span className="text-[10px] text-muted-foreground block">Tested Matches</span>
              <span className="text-base font-bold text-foreground">{result.totalMatchesTested}</span>
              <span className="text-[10px] text-muted-foreground ml-1">fixtures</span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block">1X2 Pick Accuracy</span>
              <span className="text-base font-bold text-emerald-500">
                {result.accuracy1X2Pct}%
                <span className="text-[10px] text-muted-foreground font-normal ml-1">
                  ({result.correct1X2}/{result.totalMatchesTested})
                </span>
              </span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block">Over / Under 2.5 Accuracy</span>
              <span className="text-base font-bold text-orange-500">{result.accuracyOver25Pct}%</span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block">BTTS Accuracy</span>
              <span className="text-base font-bold text-primary">{result.accuracyBTTSPct}%</span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block">Exact Score Hits</span>
              <span className="text-base font-bold text-foreground">
                {result.scoreAccuracyPct}%
                <span className="text-[10px] text-muted-foreground font-normal ml-1">
                  ({result.correctScores})
                </span>
              </span>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block" title="Multi-category Brier score. Closer to 0.0 indicates superior probabilistic calibration.">
                Brier Calibration Score
              </span>
              <span className="text-base font-bold text-blue-500">{result.brierScore}</span>
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-6">

          {/* Audit Fixture Table */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Prediction vs Actual Match Audit ({result.testSeason})
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Each fixture predicted strictly using baseline model weights trained on prior seasons
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {result.audits.length} Fixtures
              </Badge>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur z-10">
                  <TableRow className="border-b border-border text-muted-foreground font-medium">
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Home Team</TableHead>
                    <TableHead className="text-xs">Away Team</TableHead>
                    <TableHead className="text-center text-xs">Score</TableHead>
                    <TableHead className="text-center text-xs">Predicted</TableHead>
                    <TableHead className="text-center text-xs">Exp Score</TableHead>
                    <TableHead className="text-center text-xs">1X2 Result</TableHead>
                    <TableHead className="text-center text-xs">O/U 2.5</TableHead>
                    <TableHead className="text-center text-xs">BTTS</TableHead>
                    <TableHead className="text-right text-xs">Market Odds (1 / X / 2)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.audits.map((a, i) => (
                    <TableRow key={i} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="tabular-nums text-xs text-muted-foreground">{a.date}</TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        <span className="flex items-center gap-1.5" title={a.homeTeam}>
                          <TeamLogo team={a.homeTeam} size={24} />
                          <span className="truncate max-w-[152px]">{a.homeTeam}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">
                        <span className="flex items-center gap-1.5" title={a.awayTeam}>
                          <TeamLogo team={a.awayTeam} size={24} />
                          <span className="truncate max-w-[152px]">{a.awayTeam}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-xs font-medium text-foreground">
                        {a.actualScore}
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium capitalize">
                        <span
                          className={
                            a.predictedResult === "home"
                              ? "text-emerald-500"
                              : a.predictedResult === "draw"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-blue-500"
                          }
                        >
                          {a.predictedResult}
                        </span>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-xs text-muted-foreground">
                        {a.predictedScore}
                      </TableCell>
                      <TableCell className="text-center">
                        {a.isCorrect1X2 ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive/70 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {a.isCorrectOver25 ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive/70 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {a.isCorrectBTTS ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive/70 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
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
