import React, { useState, useMemo } from "react";
import {
  Sparkles,
  TrendingUp,
  Target,
  Trophy,
  History,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import type { Match, PositionStat, MatchPrediction } from "../../lib/types";
import { computePositionStats } from "../../lib/positions";
import { predictMatch } from "../../lib/predictions";
import { getAllTeams, getTeamAppearances } from "../../lib/teams";
import { DATASETS } from "../../lib/data";
import { TeamSearchInput } from "../common/TeamSearchInput";

interface JackpotPredictorProps {
  matches: Match[];
  onSelectTeamForH2H?: (teamA: string, teamB: string) => void;
}

const MONTHS = [
  { value: "all", label: "All Months" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const YEARS = ["all", "2026", "2025", "2024", "2023", "2022"];

export const JackpotPredictor: React.FC<JackpotPredictorProps> = ({ matches, onSelectTeamForH2H }) => {
  // Extract unique sorted teams and frequencies
  const allTeams = useMemo(() => getAllTeams(matches), [matches]);
  const teamAppearances = useMemo(() => getTeamAppearances(matches), [matches]);

  // Period & Jackpot filters
  const [selectedJackpot, setSelectedJackpot] = useState<string>("SportPesa - Mega Jackpot Pro");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedHistoricalEvent, setSelectedHistoricalEvent] = useState<string>("");

  // Fixtures for positions 1..17
  const [customFixtures, setCustomFixtures] = useState<Record<number, { home: string; away: string }>>({});
  const [copiedSlip, setCopiedSlip] = useState(false);
  const [detailMatch, setDetailMatch] = useState<MatchPrediction | null>(null);

  // Filter matches based on selected jackpot, month, and year for baseline analysis
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
      if (selectedMonth !== "all") {
        if (!m.date || m.date.slice(5, 7) !== selectedMonth) return false;
      }
      return true;
    });
  }, [matches, selectedJackpot, selectedMonth, selectedYear]);

  // Determine max positions (17 for SportPesa/Grand, 15 for Midweek, 20 for Super Grand, 16 for Super Jackpot)
  const maxPositions = useMemo(() => {
    if (selectedJackpot.includes("Midweek") || selectedJackpot.includes("Must Be Won")) return 15;
    if (selectedJackpot.includes("Super Grand")) return 20;
    if (selectedJackpot.includes("Super Jackpot")) return 16;
    return 17;
  }, [selectedJackpot]);

  // Compute position stats 1..N on the filtered set (or fallback to full matches if filtered set is too small)
  const positionStats: PositionStat[] = useMemo(() => {
    const targetSet = filteredMatches.length >= 100 ? filteredMatches : matches;
    return computePositionStats(targetSet, maxPositions);
  }, [filteredMatches, matches, maxPositions]);

  // Aggregate overview metrics
  const overview = useMemo(() => {
    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    let totalGoals = 0;
    let scoredCount = 0;
    let total = 0;

    for (const m of filteredMatches) {
      if (m.result === "home") homeWins++;
      else if (m.result === "draw") draws++;
      else if (m.result === "away") awayWins++;
      if (m.result === "home" || m.result === "draw" || m.result === "away") total++;

      if (m.total_goals !== null) {
        totalGoals += m.total_goals;
        scoredCount++;
      }
    }

    const t = total || 1;
    const sc = scoredCount || 1;

    return {
      totalAnalyzed: total,
      homeWinPct: Number(((homeWins / t) * 100).toFixed(1)),
      drawPct: Number(((draws / t) * 100).toFixed(1)),
      awayWinPct: Number(((awayWins / t) * 100).toFixed(1)),
      avgGoals: Number((totalGoals / sc).toFixed(2)),
    };
  }, [filteredMatches]);

  // Extract distinct historical jackpot events for quick loading
  const availableEvents = useMemo(() => {
    const eventsMap = new Map<string, { id: string; date: string; jackpot: string; count: number; matches: Match[] }>();
    const sourceSet = selectedJackpot !== "all" ? filteredMatches : matches;

    for (const m of sourceSet) {
      if (!m.jackpot_event_id || !m.date) continue;
      if (!eventsMap.has(m.jackpot_event_id)) {
        eventsMap.set(m.jackpot_event_id, {
          id: m.jackpot_event_id,
          date: m.date,
          jackpot: m.jackpot,
          count: 0,
          matches: [],
        });
      }
      const ev = eventsMap.get(m.jackpot_event_id)!;
      ev.count++;
      ev.matches.push(m);
    }

    return Array.from(eventsMap.values())
      .filter((ev) => ev.count >= 12)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);
  }, [filteredMatches, matches, selectedJackpot]);

  // Load a historical jackpot slip into the 1..17 fixtures
  const handleLoadHistoricalEvent = (eventId: string) => {
    setSelectedHistoricalEvent(eventId);
    if (!eventId) {
      setCustomFixtures({});
      return;
    }
    const found = availableEvents.find((e) => e.id === eventId);
    if (!found) return;

    const newFix: Record<number, { home: string; away: string }> = {};
    for (const m of found.matches) {
      if (m.position >= 1 && m.position <= maxPositions) {
        newFix[m.position] = { home: m.home_team, away: m.away_team };
      }
    }
    setCustomFixtures(newFix);
  };

  // Update a single fixture team
  const handleUpdateFixture = (pos: number, field: "home" | "away", val: string) => {
    setCustomFixtures((prev) => ({
      ...prev,
      [pos]: {
        home: field === "home" ? val : prev[pos]?.home || "",
        away: field === "away" ? val : prev[pos]?.away || "",
      },
    }));
  };

  // Generate predictions for rows 1..N
  const predictions: MatchPrediction[] = useMemo(() => {
    const list: MatchPrediction[] = [];
    for (let p = 1; p <= maxPositions; p++) {
      const fix = customFixtures[p];
      const hTeam = fix?.home?.trim() || "";
      const aTeam = fix?.away?.trim() || "";

      if (hTeam && aTeam) {
        list.push(predictMatch(matches, hTeam, aTeam, p, positionStats));
      } else {
        // Fallback to pure position historical pattern if no teams specified
        const posStat = positionStats.find((s) => s.position === p);
        const homeProb = posStat ? posStat.homeWinPct : 45;
        const drawProb = posStat ? posStat.drawPct : 28;
        const awayProb = posStat ? posStat.awayWinPct : 27;

        let predictedResult: "home" | "draw" | "away" = "home";
        if (drawProb > homeProb && drawProb > awayProb) predictedResult = "draw";
        else if (awayProb > homeProb && awayProb > drawProb) predictedResult = "away";

        list.push({
          position: p,
          homeTeam: hTeam || `Team ${p}A`,
          awayTeam: aTeam || `Team ${p}B`,
          homeProb,
          drawProb,
          awayProb,
          predictedResult,
          confidence: (posStat?.totalMatches || 0) > 50 ? "Medium" : "Low",
          expectedHomeGoals: posStat ? posStat.avgHomeGoals : 1.35,
          expectedAwayGoals: posStat ? posStat.avgAwayGoals : 1.05,
          totalExpectedGoals: posStat ? posStat.avgGoals : 2.4,
          mostLikelyScores: posStat?.topScores.map((s) => ({
            score: s.score,
            homeGoals: 0,
            awayGoals: 0,
            probability: s.pct,
          })) || [{ score: "1-1", homeGoals: 1, awayGoals: 1, probability: 14.5 }],
          h2hMatchesCount: 0,
          positionSampleSize: posStat ? posStat.totalMatches : 0,
          signals: posStat ? [
            {
              label: `Historical Position #${p}`,
              detail: `Based on ${posStat.totalMatches} matches in position ${p}.`,
              impact: predictedResult,
            },
          ] : [],
        });
      }
    }
    return list;
  }, [maxPositions, customFixtures, matches, positionStats]);

  // Copy full slip as formatted text (e.g. "1. 1 (61%), 2. X (42%)...")
  const handleCopySlip = () => {
    const text = predictions
      .map((p) => {
        const pick = p.predictedResult === "home" ? "1" : p.predictedResult === "draw" ? "X" : "2";
        const score = p.mostLikelyScores[0]?.score || "1-1";
        const teamInfo = p.homeTeam.startsWith("Team ") ? "" : ` (${p.homeTeam} vs ${p.awayTeam})`;
        return `${p.position}. Pick: ${pick} | Exp: ${score} | Prob: ${p.homeProb}% - ${p.drawProb}% - ${p.awayProb}%${teamInfo}`;
      })
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Jackpot Predictor Engine</h1>
            <Badge variant="secondary" className="text-xs font-mono">
              Positions 1–{maxPositions}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Predict upcoming jackpot slips based on historical position biases (1–{maxPositions}), team form, head-to-head records, and Poisson score distributions.
          </p>
        </div>

        {/* Controls: Copy Prediction Slip */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySlip}
            className="text-xs gap-1.5 h-8"
          >
            {copiedSlip ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            <span>{copiedSlip ? "Slip Copied!" : "Copy Prediction Slip"}</span>
          </Button>

          {Object.keys(customFixtures).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCustomFixtures({});
                setSelectedHistoricalEvent("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground h-8"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Clear Fixtures
            </Button>
          )}
        </div>
      </div>

      {/* Filter / Controls Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-card border border-border rounded-xl p-4 shadow-xs">
        {/* Jackpot Selector */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Jackpot</label>
          <NativeSelect
            value={selectedJackpot}
            onChange={(e) => {
              setSelectedJackpot(e.target.value);
              setSelectedHistoricalEvent("");
            }}
            className="w-full text-xs"
          >
            <NativeSelectOption value="all">All Jackpots Combined</NativeSelectOption>
            {DATASETS.map((d) => (
              <NativeSelectOption key={d.file} value={`${d.bookmaker} - ${d.jackpot}`}>
                {d.bookmaker.toUpperCase()}: {d.jackpot}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {/* Month Selector */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Historical Month</label>
          <NativeSelect
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full text-xs"
          >
            {MONTHS.map((m) => (
              <NativeSelectOption key={m.value} value={m.value}>
                {m.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {/* Year Selector */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Historical Year</label>
          <NativeSelect
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full text-xs"
          >
            <NativeSelectOption value="all">All Historical Years (2022–2026)</NativeSelectOption>
            {YEARS.filter((y) => y !== "all").map((y) => (
              <NativeSelectOption key={y} value={y}>
                {y}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {/* Load Historical Event Dropdown */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Load Past Jackpot Slip</label>
          <NativeSelect
            value={selectedHistoricalEvent}
            onChange={(e) => handleLoadHistoricalEvent(e.target.value)}
            className="w-full text-xs"
          >
            <NativeSelectOption value="">Select a past jackpot date...</NativeSelectOption>
            {availableEvents.map((ev) => (
              <NativeSelectOption key={ev.id} value={ev.id}>
                {ev.date} — {ev.jackpot} ({ev.count} matches)
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px] flex items-center gap-1">
              <History className="h-3 w-3 text-muted-foreground" />
              Analyzed Matches
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-foreground">
              {overview.totalAnalyzed.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px] flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              Home Win %
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-emerald-400">
              {overview.homeWinPct}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px] flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
              Draw %
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-amber-400">
              {overview.drawPct}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px] flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
              Away Win %
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-blue-400">
              {overview.awayWinPct}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-[11px] flex items-center gap-1">
              <Target className="h-3 w-3 text-primary" />
              Avg Goals / Match
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-primary">
              {overview.avgGoals}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main 1–17 Table Section */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Jackpot Positions 1 to {maxPositions} Prediction Table
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Click any row to inspect historical signals & score probability matrix
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                <th className="py-2.5 px-3 w-14 text-center">Pos</th>
                <th className="py-2.5 px-3 min-w-[340px]">Match Fixture (Home vs Away)</th>
                <th className="py-2.5 px-3 text-center min-w-[130px]">1X2 Distribution</th>
                <th className="py-2.5 px-3 text-center min-w-[70px]">Avg Goals</th>
                <th className="py-2.5 px-3 text-center min-w-[90px]">Likely Score</th>
                <th className="py-2.5 px-3 text-center min-w-[90px]">Prediction</th>
                <th className="py-2.5 px-3 text-center min-w-[80px]">Confidence</th>
                <th className="py-2.5 px-3 text-right w-12">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {predictions.map((pred) => {
                const posStat = positionStats.find((s) => s.position === pred.position);
                const isCustom = customFixtures[pred.position]?.home && customFixtures[pred.position]?.away;

                return (
                  <tr
                    key={pred.position}
                    onClick={() => setDetailMatch(pred)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    {/* Position Number */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted text-foreground font-bold font-mono text-xs border border-border">
                        {pred.position}
                      </span>
                    </td>

                    {/* Match Fixture Input / Display */}
                    <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <TeamSearchInput
                          size="xs"
                          placeholder={`Home Team ${pred.position}`}
                          value={customFixtures[pred.position]?.home || ""}
                          onChange={(val) => handleUpdateFixture(pred.position, "home", val)}
                          teams={allTeams}
                          teamAppearances={teamAppearances}
                          className="w-36"
                        />
                        <span className="text-muted-foreground text-[10px] font-semibold">vs</span>
                        <TeamSearchInput
                          size="xs"
                          placeholder={`Away Team ${pred.position}`}
                          value={customFixtures[pred.position]?.away || ""}
                          onChange={(val) => handleUpdateFixture(pred.position, "away", val)}
                          teams={allTeams}
                          teamAppearances={teamAppearances}
                          className="w-36"
                        />
                        {isCustom && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 text-emerald-400 border-emerald-500/30">
                            Active
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* 1X2 Distribution Bar */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-emerald-400 font-medium">{pred.homeProb}%</span>
                          <span className="text-amber-400 font-medium">{pred.drawProb}%</span>
                          <span className="text-blue-400 font-medium">{pred.awayProb}%</span>
                        </div>
                        {/* Visual Split Bar */}
                        <div className="h-1.5 w-full bg-muted rounded-full flex overflow-hidden">
                          <div style={{ width: `${pred.homeProb}%` }} className="bg-emerald-500 h-full" />
                          <div style={{ width: `${pred.drawProb}%` }} className="bg-amber-500 h-full" />
                          <div style={{ width: `${pred.awayProb}%` }} className="bg-blue-500 h-full" />
                        </div>
                      </div>
                    </td>

                    {/* Average Goals */}
                    <td className="py-2.5 px-3 text-center font-mono font-medium text-foreground">
                      {pred.totalExpectedGoals || posStat?.avgGoals || "2.40"}
                    </td>

                    {/* Most Likely Score */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-mono font-semibold px-2 py-0.5 rounded bg-muted border border-border text-foreground">
                        {pred.mostLikelyScores[0]?.score || "1-1"}
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-0.5 font-mono">
                        ({pred.mostLikelyScores[0]?.probability || 14}%)
                      </span>
                    </td>

                    {/* Predicted Result Badge */}
                    <td className="py-2.5 px-3 text-center">
                      {pred.predictedResult === "home" && (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white font-bold">
                          HOME (1)
                        </Badge>
                      )}
                      {pred.predictedResult === "draw" && (
                        <Badge variant="default" className="bg-amber-600 hover:bg-amber-600 text-white font-bold">
                          DRAW (X)
                        </Badge>
                      )}
                      {pred.predictedResult === "away" && (
                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-600 text-white font-bold">
                          AWAY (2)
                        </Badge>
                      )}
                    </td>

                    {/* Confidence Rating */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[11px] font-semibold ${
                          pred.confidence === "High"
                            ? "text-emerald-400"
                            : pred.confidence === "Medium"
                            ? "text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {pred.confidence}
                      </span>
                    </td>

                    {/* Arrow / Detail Icon */}
                    <td className="py-2.5 px-3 text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground inline-block transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Detail Dialog / Inspection Modal */}
      {detailMatch && (
        <Dialog open={!!detailMatch} onOpenChange={(open) => !open && setDetailMatch(null)}>
          <DialogContent className="max-w-2xl bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <span className="h-6 w-6 rounded bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs font-mono">
                  #{detailMatch.position}
                </span>
                <span>{detailMatch.homeTeam} vs {detailMatch.awayTeam}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Statistical prediction breakdown combining position #{detailMatch.position} tendencies, team form, and Poisson score simulation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Outcome Probability Summary */}
              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-muted/40 border border-border">
                <div className="p-2 rounded bg-card border border-border">
                  <span className="text-muted-foreground text-[10px] block">Home Win (1)</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">{detailMatch.homeProb}%</span>
                </div>
                <div className="p-2 rounded bg-card border border-border">
                  <span className="text-muted-foreground text-[10px] block">Draw (X)</span>
                  <span className="text-lg font-bold font-mono text-amber-400">{detailMatch.drawProb}%</span>
                </div>
                <div className="p-2 rounded bg-card border border-border">
                  <span className="text-muted-foreground text-[10px] block">Away Win (2)</span>
                  <span className="text-lg font-bold font-mono text-blue-400">{detailMatch.awayProb}%</span>
                </div>
              </div>

              {/* Signals and Rationale */}
              <div className="space-y-2">
                <span className="font-semibold text-foreground text-xs block">Key Contributing Signals:</span>
                {detailMatch.signals.map((sig, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">{sig.label}</div>
                      <div className="text-muted-foreground text-[11px] mt-0.5">{sig.detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Top 5 Likely Scores */}
              <div className="space-y-2">
                <span className="font-semibold text-foreground text-xs block">Top 5 Most Likely Scores (Poisson Model):</span>
                <div className="grid grid-cols-5 gap-2">
                  {detailMatch.mostLikelyScores.map((sc, i) => (
                    <div key={i} className="p-2 rounded bg-muted/50 border border-border text-center">
                      <span className="font-mono font-bold text-sm text-foreground block">{sc.score}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{sc.probability}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* H2H Shortcut Button */}
              {onSelectTeamForH2H && !detailMatch.homeTeam.startsWith("Team ") && (
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onSelectTeamForH2H(detailMatch.homeTeam, detailMatch.awayTeam);
                      setDetailMatch(null);
                    }}
                    className="text-xs gap-1.5"
                  >
                    <BarChart2 className="h-3.5 w-3.5" />
                    Open in H2H & Teams Tab
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
