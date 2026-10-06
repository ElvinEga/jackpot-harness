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
  Zap,
  Download,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

import type { Match, PositionStat, MatchPrediction } from "../../lib/types";
import { computePositionStats } from "../../lib/positions";
import { predictMatch } from "../../lib/predictions";
import { getAllTeams, getTeamAppearances } from "../../lib/teams";
import { DATASETS } from "../../lib/data";
import { TeamSearchInput } from "../common/TeamSearchInput";
import { SportPesaImportModal } from "./SportPesaImportModal";
import { fetchActiveSportPesaJackpot, type ParsedSportPesaJackpot } from "../../lib/sportpesa";
import { MozzartImportModal } from "./MozzartImportModal";
import { fetchActiveMozzartJackpot, type ParsedMozzartJackpot } from "../../lib/mozzart";

export interface FixtureEntry {
  home: string;
  away: string;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  tournament?: string;
  country?: string;
  kickOffTime?: string;
}

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

  // SportPesa API prefill & state
  const [apiSheetOpen, setApiSheetOpen] = useState(false);
  const [isSportPesaModalOpen, setIsSportPesaModalOpen] = useState(false);
  const [isFetchingSportPesa, setIsFetchingSportPesa] = useState(false);
  const [activeSportPesaMeta, setActiveSportPesaMeta] = useState<{ id: string; humanId: number; status: string } | null>(null);
  const [prefillPreset, setPrefillPreset] = useState<string>("");

  // Mozzart API prefill & state
  const [isMozzartModalOpen, setIsMozzartModalOpen] = useState(false);
  const [isFetchingMozzart, setIsFetchingMozzart] = useState(false);
  const [activeMozzartMeta, setActiveMozzartMeta] = useState<{ id: number; roundId: number; jackpotAmount: number | null } | null>(null);

  // Fixtures for positions 1..17
  const [customFixtures, setCustomFixtures] = useState<Record<number, FixtureEntry>>({});
  const [copiedSlip, setCopiedSlip] = useState(false);
  const [detailMatch, setDetailMatch] = useState<MatchPrediction | null>(null);

  // Prefill protection: track hand-typed rows and pending destructive replace
  const [hasManualEdits, setHasManualEdits] = useState(false);
  const [replacePrompt, setReplacePrompt] = useState<{ label: string; mutate: () => void } | null>(null);

  interface FixtureSnapshot {
    fixtures: Record<number, FixtureEntry>;
    sportpesaMeta: { id: string; humanId: number; status: string } | null;
    mozzartMeta: { id: number; roundId: number; jackpotAmount: number | null } | null;
    preset: string;
    historicalEvent: string;
    manual: boolean;
  }

  const takeSnapshot = (): FixtureSnapshot => ({
    fixtures: customFixtures,
    sportpesaMeta: activeSportPesaMeta,
    mozzartMeta: activeMozzartMeta,
    preset: prefillPreset,
    historicalEvent: selectedHistoricalEvent,
    manual: hasManualEdits,
  });

  const restoreSnapshot = (s: FixtureSnapshot) => {
    setCustomFixtures(s.fixtures);
    setActiveSportPesaMeta(s.sportpesaMeta);
    setActiveMozzartMeta(s.mozzartMeta);
    setPrefillPreset(s.preset);
    setSelectedHistoricalEvent(s.historicalEvent);
    setHasManualEdits(s.manual);
  };

  // Apply a fixture-replacing change; if rows already exist, offer Undo via toast
  const runWithUndo = (label: string, mutate: () => void) => {
    const hadRows = Object.keys(customFixtures).length > 0;
    const snapshot = takeSnapshot();
    mutate();
    if (hadRows) {
      toast.add({
        title: `${label} applied`,
        description: "Your previous fixtures were replaced.",
        actionProps: { children: "Undo", onClick: () => restoreSnapshot(snapshot) },
        timeout: 10000,
      });
    }
  };

  // Destructive replace over hand-typed rows requires an explicit confirm first
  const requestReplace = (label: string, mutate: () => void) => {
    if (Object.keys(customFixtures).length > 0 && hasManualEdits) {
      setReplacePrompt({ label, mutate });
    } else {
      runWithUndo(label, mutate);
    }
  };

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

  // Apply parsed SportPesa jackpot payload into 1..17 fixtures
  const applySportPesaJackpot = (jp: ParsedSportPesaJackpot) => {
    setSelectedJackpot("SportPesa - Mega Jackpot Pro");
    const newFix: Record<number, FixtureEntry> = {};
    for (const m of jp.matches) {
      newFix[m.order] = {
        home: m.homeTeam,
        away: m.awayTeam,
        homeOdds: m.homeOdds,
        drawOdds: m.drawOdds,
        awayOdds: m.awayOdds,
        tournament: m.tournament,
        country: m.country,
        kickOffTime: m.kickOffTime,
      };
    }
    setCustomFixtures(newFix);
    setActiveSportPesaMeta({ id: jp.id, humanId: jp.humanId, status: jp.bettingStatus });
    setPrefillPreset("sportpesa-live");
    setSelectedHistoricalEvent("");
    setHasManualEdits(false);
  };

  // Quick single-click fetch from SportPesa API
  const handleQuickPrefillSportPesa = async () => {
    setIsFetchingSportPesa(true);
    try {
      const jp = await fetchActiveSportPesaJackpot();
      requestReplace("SportPesa live jackpot", () => applySportPesaJackpot(jp));
    } catch (err) {
      console.error("Failed to quick-fetch SportPesa:", err);
      toast.add({
        title: "SportPesa live fetch failed",
        description: "Network or API problem — you can paste the JSON payload manually.",
        type: "warning",
        timeout: 6000,
      });
      setIsSportPesaModalOpen(true);
    } finally {
      setIsFetchingSportPesa(false);
    }
  };

  // Selector preset change handler
  const handleSelectPreset = (val: string) => {
    setPrefillPreset(val);
    if (val === "sportpesa-live") {
      handleQuickPrefillSportPesa();
    } else if (val === "mozzart-live") {
      handleQuickPrefillMozzart();
    }
  };

  // Apply parsed Mozzart jackpot payload into 1..16 fixtures
  const applyMozzartJackpot = (jp: ParsedMozzartJackpot) => {
    setSelectedJackpot("Mozzart - Super Jackpot");
    const newFix: Record<number, FixtureEntry> = {};
    for (const m of jp.matches) {
      newFix[m.rowNumber] = {
        home: m.homeTeam,
        away: m.awayTeam,
        homeOdds: m.homeOdds,
        drawOdds: m.drawOdds,
        awayOdds: m.awayOdds,
        tournament: m.competition,
        country: m.country,
        kickOffTime: m.kickOffTime,
      };
    }
    setCustomFixtures(newFix);
    setActiveMozzartMeta({ id: jp.id, roundId: jp.roundId, jackpotAmount: jp.jackpotAmount });
    setActiveSportPesaMeta(null);
    setPrefillPreset("mozzart-live");
    setSelectedHistoricalEvent("");
    setHasManualEdits(false);
  };

  // Quick single-click fetch from Mozzart API
  const handleQuickPrefillMozzart = async () => {
    setIsFetchingMozzart(true);
    try {
      const jp = await fetchActiveMozzartJackpot();
      requestReplace("Mozzart live jackpot", () => applyMozzartJackpot(jp));
    } catch (err) {
      console.error("Failed to quick-fetch Mozzart:", err);
      toast.add({
        title: "Mozzart live fetch failed",
        description: "Network or API problem — you can paste the JSON payload manually.",
        type: "warning",
        timeout: 6000,
      });
      setIsMozzartModalOpen(true);
    } finally {
      setIsFetchingMozzart(false);
    }
  };

  // Load a historical jackpot slip into the 1..17 fixtures
  const handleLoadHistoricalEvent = (eventId: string) => {
    setSelectedHistoricalEvent(eventId);
    if (!eventId) {
      runWithUndo("Slip cleared", () => {
        setCustomFixtures({});
        setActiveSportPesaMeta(null);
        setPrefillPreset("");
      });
      return;
    }
    const found = availableEvents.find((e) => e.id === eventId);
    if (!found) return;

    requestReplace("Past jackpot slip", () => {
      const newFix: Record<number, FixtureEntry> = {};
      for (const m of found.matches) {
        if (m.position >= 1 && m.position <= maxPositions) {
          newFix[m.position] = { home: m.home_team, away: m.away_team };
        }
      }
      setCustomFixtures(newFix);
      setActiveSportPesaMeta(null);
      setPrefillPreset("historical");
      setHasManualEdits(false);
    });
  };

  // Update a single fixture team
  const handleUpdateFixture = (pos: number, field: "home" | "away", val: string) => {
    setHasManualEdits(true);
    setCustomFixtures((prev) => ({
      ...prev,
      [pos]: {
        ...prev[pos],
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
        list.push(
          predictMatch(matches, hTeam, aTeam, p, positionStats, {
            odds:
              fix?.homeOdds && fix?.drawOdds && fix?.awayOdds
                ? { home: fix.homeOdds, draw: fix.drawOdds, away: fix.awayOdds }
                : undefined,
            tournament: fix?.tournament,
            country: fix?.country,
            kickOffTime: fix?.kickOffTime,
          })
        );
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
        const hasFixture = !p.homeTeam.startsWith("Team ") && !p.awayTeam.startsWith("Team ");
        const suffix = hasFixture
          ? ` (${p.homeTeam} vs ${p.awayTeam})`
          : " (position pattern only — no fixture set)";
        return `${p.position}. Pick: ${pick} | Exp: ${score} | Prob: ${p.homeProb}% - ${p.drawProb}% - ${p.awayProb}%${suffix}`;
      })
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-2 space-y-6  mx-auto w-full">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Predictor</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Predict upcoming jackpot slips based on historical position biases.
          </p>
        </div>

        {/* Controls: API Prefill & Copy Prediction Slip */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setApiSheetOpen(true)}
            className="text-xs gap-1.5 h-8"
          >
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            <span>API Prefill</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySlip}
            className="text-xs gap-1.5 h-8"
          >
            {copiedSlip ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            <span>{copiedSlip ? "Slip Copied!" : "Copy Prediction Slip"}</span>
          </Button>

          {Object.keys(customFixtures).length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                runWithUndo("Fixtures cleared", () => {
                  setCustomFixtures({});
                  setSelectedHistoricalEvent("");
                  setActiveSportPesaMeta(null);
                  setActiveMozzartMeta(null);
                  setPrefillPreset("");
                  setHasManualEdits(false);
                })
              }
              className="text-xs text-muted-foreground hover:text-foreground h-8"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Clear Fixtures
            </Button>
          )}
        </div>
      </div>

      {/* API Prefill sheet — live prefill toolbars for both bookmakers */}
      <Sheet open={apiSheetOpen} onOpenChange={setApiSheetOpen}>
        <SheetContent side="right" className="w-full! sm:max-w-lg! gap-0 p-0 overflow-y-auto">
          <SheetHeader className="border-b border-border px-4 py-4 text-left">
            <SheetTitle>API Prefill</SheetTitle>
            <SheetDescription>
              Pull live jackpot fixtures and real-time odds straight from the bookmaker APIs.
            </SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-4">

      {/* SportPesa Live API Prefill Toolbar */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex flex-col  items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                SportPesa Mega Jackpot Pro — API Prefill
              </span>
              {activeSportPesaMeta ? (
                <Badge variant="outline" className="text-xs px-1.5 py-0 text-primary border-primary/30 font-mono">
                  #{activeSportPesaMeta.humanId} Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs px-1.5 py-0 text-muted-foreground border-primary/30 font-mono">
                  17 Matches
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeSportPesaMeta
                ? `Active jackpot #${activeSportPesaMeta.humanId} loaded with live 1X2 odds, kickoffs, and tournament data.`
                : `Instantly prefill all 17 match fixtures from SportPesa's active jackpot API with real-time odds.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickPrefillSportPesa}
            disabled={isFetchingSportPesa}
            className="h-8 text-xs font-semibold gap-1.5 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary shadow-xs"
          >
            {isFetchingSportPesa ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>{isFetchingSportPesa ? "Fetching..." : "Prefill from SportPesa API"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setApiSheetOpen(false);
              setIsSportPesaModalOpen(true);
            }}
            className="h-8 text-xs gap-1.5"
            title="Inspect SportPesa API payload or paste custom JSON"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>API Options</span>
          </Button>
        </div>
      </div>

      {/* Mozzart Live API Prefill Toolbar */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 flex flex-col  items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                Mozzart Super Jackpot — API Prefill
              </span>
              {activeMozzartMeta ? (
                <Badge variant="outline" className="text-xs px-1.5 py-0 text-primary border-primary/30 font-mono">
                  Round #{activeMozzartMeta.roundId} Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs px-1.5 py-0 text-primary border-primary/30 font-mono">
                  16 Matches
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeMozzartMeta
                ? `Round #${activeMozzartMeta.roundId} loaded with live 1X2 odds and competition data.`
                : `Instantly prefill all 16 match fixtures from Mozzart's active super jackpot API with real-time odds.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickPrefillMozzart}
            disabled={isFetchingMozzart}
            className="h-8 text-xs font-semibold gap-1.5 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 shadow-xs"
          >
            {isFetchingMozzart ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>{isFetchingMozzart ? "Fetching..." : "Prefill from Mozzart API"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setApiSheetOpen(false);
              setIsMozzartModalOpen(true);
            }}
            className="h-8 text-xs gap-1.5"
            title="Inspect Mozzart API payload or paste custom JSON"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>API Options</span>
          </Button>
        </div>
      </div>

          </div>
        </SheetContent>
      </Sheet>

      {/* Filter / Controls Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-card border border-border rounded-xl p-4 shadow-xs">
        {/* Prefill Preset Selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Prefill Fixtures</label>
          <NativeSelect
            value={prefillPreset}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="w-full text-xs font-medium"
          >
            <NativeSelectOption value="">Select prefill source...</NativeSelectOption>
            <NativeSelectOption value="sportpesa-live">SportPesa Mega Jackpot Pro (Active)</NativeSelectOption>
            <NativeSelectOption value="mozzart-live">Mozzart Super Jackpot (Active)</NativeSelectOption>
          </NativeSelect>
        </div>

        {/* Jackpot Selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Jackpot</label>
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
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Historical Month</label>
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
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Historical Year</label>
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
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Load Past Jackpot Slip</label>
          <SearchableSelect
            size="sm"
            value={selectedHistoricalEvent}
            onValueChange={(val) => handleLoadHistoricalEvent(val)}
            options={[
              { value: "", label: "Select a past jackpot date..." },
              ...availableEvents.map((ev) => ({
                value: ev.id,
                label: `${ev.date} — ${ev.jackpot} (${ev.count} matches)`,
              })),
            ]}
            placeholder="Select a past jackpot date..."
            searchPlaceholder="Search past dates..."
            clearable={!!selectedHistoricalEvent}
            className="w-full text-xs font-mono"
            popoverWidth="w-80"
          />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs flex items-center gap-1">
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
            <CardDescription className="text-xs flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary inline-block" />
              Home Win %
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-primary">
              {overview.homeWinPct}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-300 inline-block" />
              Draw %
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-foreground">
              {overview.drawPct}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-500 inline-block" />
              Away Win %
            </CardDescription>
            <CardTitle className="text-xl font-bold font-mono text-foreground">
              {overview.awayWinPct}%
            </CardTitle>
          </CardHeader>
        </Card>

        <Card size="sm" className="bg-card border-border shadow-xs">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs flex items-center gap-1">
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
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 text-muted-foreground font-medium">
                <TableHead className="w-12 text-center text-xs">Pos</TableHead>
                <TableHead className="min-w-[340px] text-xs">Match Fixture (Home vs Away)</TableHead>
                <TableHead className="text-center min-w-[130px] text-xs">1X2 Distribution</TableHead>
                <TableHead className="text-center min-w-[70px] text-xs">Avg Goals</TableHead>
                <TableHead className="text-center min-w-[90px] text-xs">Likely Score</TableHead>
                <TableHead className="text-center min-w-[90px] text-xs">Prediction</TableHead>
                <TableHead className="text-center min-w-[80px] text-xs">Confidence</TableHead>
                <TableHead className="text-right w-12 text-xs">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictions.map((pred) => {
                const posStat = positionStats.find((s) => s.position === pred.position);
                const isCustom = customFixtures[pred.position]?.home && customFixtures[pred.position]?.away;

                return (
                  <TableRow
                    key={pred.position}
                    tabIndex={0}
                    onClick={() => setDetailMatch(pred)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailMatch(pred);
                      }
                    }}
                    aria-label={`Position ${pred.position}: ${pred.homeTeam} vs ${pred.awayTeam}. Press Enter to inspect prediction`}
                    className="hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring transition-colors cursor-pointer group"
                  >
                    {/* Position Number */}
                    <TableCell className="text-center text-xs font-medium text-foreground">
                      #{pred.position}
                    </TableCell>

                    {/* Match Fixture Input / Display */}
                    <TableCell className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-1">
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
                          <span className="text-muted-foreground text-xs font-medium">vs</span>
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
                            <span className="text-[11px] font-medium text-primary">
                              Active
                            </span>
                          )}
                        </div>

                        {/* SportPesa Live Market Odds & Tournament info */}
                        {pred.bookmakerOdds && (
                          <div className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground pl-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                              SP Odds: {pred.bookmakerOdds.home?.toFixed(2)} | {pred.bookmakerOdds.draw?.toFixed(2)} | {pred.bookmakerOdds.away?.toFixed(2)}
                            </span>
                            {pred.tournament && (
                              <span className="text-muted-foreground truncate max-w-[170px] text-xs">
                                {pred.tournament} {pred.country ? `(${pred.country})` : ""}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* 1X2 Distribution Bar */}
                    <TableCell className="px-2 py-1">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs tabular-nums">
                          <span className="text-primary font-medium">{pred.homeProb}%</span>
                          <span className="text-foreground font-medium">{pred.drawProb}%</span>
                          <span className="text-muted-foreground font-medium">{pred.awayProb}%</span>
                        </div>
                        {/* Visual Split Bar */}
                        <div className="h-1.5 w-full bg-muted rounded-full flex overflow-hidden">
                          <div style={{ width: `${pred.homeProb}%` }} className="bg-primary h-full" />
                          <div style={{ width: `${pred.drawProb}%` }} className="bg-slate-300 h-full" />
                          <div style={{ width: `${pred.awayProb}%` }} className="bg-slate-500 h-full" />
                        </div>
                      </div>
                    </TableCell>

                    {/* Average Goals */}
                    <TableCell className="text-center tabular-nums text-xs font-medium text-foreground">
                      {pred.totalExpectedGoals || posStat?.avgGoals || "2.40"}
                    </TableCell>

                    {/* Most Likely Score */}
                    <TableCell className="text-center tabular-nums text-xs">
                      <span className="font-medium text-foreground">
                        {pred.mostLikelyScores[0]?.score || "1-1"}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        ({pred.mostLikelyScores[0]?.probability || 14}%)
                      </span>
                    </TableCell>

                    {/* Predicted Result Badge */}
                    <TableCell className="text-center text-xs font-medium">
                      {pred.predictedResult === "home" && (
                        <span className="text-emerald-500">HOME (1)</span>
                      )}
                      {pred.predictedResult === "draw" && (
                        <span className="text-amber-500">DRAW (X)</span>
                      )}
                      {pred.predictedResult === "away" && (
                        <span className="text-primary">AWAY (2)</span>
                      )}
                    </TableCell>

                    {/* Confidence Rating */}
                    <TableCell className="text-center text-xs font-medium">
                      <span
                        className={
                          pred.confidence === "High"
                            ? "text-primary"
                            : pred.confidence === "Medium"
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {pred.confidence}
                      </span>
                    </TableCell>

                    {/* Arrow / Detail Icon */}
                    <TableCell className="text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground inline-block transition-colors" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
                  <span className="text-muted-foreground text-xs block">Home Win (1)</span>
                  <span className="text-lg font-bold font-mono text-primary">{detailMatch.homeProb}%</span>
                </div>
                <div className="p-2 rounded bg-card border border-border">
                  <span className="text-muted-foreground text-xs block">Draw (X)</span>
                  <span className="text-lg font-bold font-mono text-foreground">{detailMatch.drawProb}%</span>
                </div>
                <div className="p-2 rounded bg-card border border-border">
                  <span className="text-muted-foreground text-xs block">Away Win (2)</span>
                  <span className="text-lg font-bold font-mono text-foreground">{detailMatch.awayProb}%</span>
                </div>
              </div>

              {/* SportPesa Live Market Odds Card if present */}
              {detailMatch.bookmakerOdds && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      SportPesa Live 1X2 Market Odds
                    </span>
                    {detailMatch.tournament && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {detailMatch.tournament} {detailMatch.country ? `• ${detailMatch.country}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-1.5 rounded bg-card border border-border">
                      <span className="text-xs text-muted-foreground block">Home (1)</span>
                      <span className="text-sm font-bold font-mono text-primary">
                        {detailMatch.bookmakerOdds.home?.toFixed(2) || "-"}
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-card border border-border">
                      <span className="text-xs text-muted-foreground block">Draw (X)</span>
                      <span className="text-sm font-bold font-mono text-foreground">
                        {detailMatch.bookmakerOdds.draw?.toFixed(2) || "-"}
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-card border border-border">
                      <span className="text-xs text-muted-foreground block">Away (2)</span>
                      <span className="text-sm font-bold font-mono text-foreground">
                        {detailMatch.bookmakerOdds.away?.toFixed(2) || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Signals and Rationale */}
              <div className="space-y-2">
                <span className="font-semibold text-foreground text-xs block">Key Contributing Signals:</span>
                {detailMatch.signals.map((sig, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-foreground">{sig.label}</div>
                      <div className="text-muted-foreground text-xs mt-0.5">{sig.detail}</div>
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
                      <span className="text-xs text-muted-foreground font-mono">{sc.probability}%</span>
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

      {/* SportPesa API Import / Options Modal */}
      <SportPesaImportModal
        open={isSportPesaModalOpen}
        onOpenChange={setIsSportPesaModalOpen}
        onApplyJackpot={(jp) => requestReplace("SportPesa jackpot", () => applySportPesaJackpot(jp))}
      />

      {/* Mozzart API Import / Options Modal */}
      <MozzartImportModal
        open={isMozzartModalOpen}
        onOpenChange={setIsMozzartModalOpen}
        onApplyJackpot={(jp) => requestReplace("Mozzart jackpot", () => applyMozzartJackpot(jp))}
      />

      {/* Confirm before replacing manually edited fixtures */}
      <AlertDialog
        open={replacePrompt !== null}
        onOpenChange={(open) => {
          if (!open) setReplacePrompt(null);
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your edits?</AlertDialogTitle>
            <AlertDialogDescription>
              You have manually edited fixtures. Loading the {replacePrompt?.label ?? ""} will
              discard them and replace all {maxPositions} rows.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep mine</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const prompt = replacePrompt;
                setReplacePrompt(null);
                if (prompt) runWithUndo(prompt.label, prompt.mutate);
              }}
            >
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
