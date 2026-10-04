import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Shield,
  Goal,
  Copy,
  Check,
  Sparkles,
  Trophy,
  Activity,
  FileCode,
  Flame,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { SeasonMatch } from "../../lib/seasonTypes";

interface SeasonMatchDetailSheetProps {
  match: SeasonMatch | null;
  onClose: () => void;
  onSelectTeamForAnalysis?: (team: string) => void;
  onPredictMatchup?: (home: string, away: string) => void;
}

export const SeasonMatchDetailSheet: React.FC<SeasonMatchDetailSheetProps> = ({
  match,
  onClose,
  onSelectTeamForAnalysis,
  onPredictMatchup,
}) => {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  if (!match) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(match, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getResultBadge = () => {
    if (match.result === "home") {
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-semibold">
          Home Win
        </Badge>
      );
    }
    if (match.result === "draw") {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold">
          Draw
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 font-semibold">
        Away Win
      </Badge>
    );
  };

  return (
    <Sheet open={!!match} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col bg-card border-border overflow-hidden">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs font-mono">
              {match.season} • {match.league}
            </Badge>
            {getResultBadge()}
          </div>

          <SheetTitle className="text-xl font-bold tracking-tight text-foreground mt-3 flex items-center justify-between">
            <span>{match.home_team}</span>
            <span className="font-mono text-2xl px-3 py-1 rounded-lg bg-muted border border-border text-foreground">
              {match.score}
            </span>
            <span>{match.away_team}</span>
          </SheetTitle>

          <SheetDescription className="text-xs text-muted-foreground flex items-center justify-between mt-1">
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar className="h-3.5 w-3.5" />
              {match.date} {match.kickoff_time && `at ${match.kickoff_time}`}
            </span>
            <span>Referee: <strong className="text-foreground">{match.referee || "N/A"}</strong></span>
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Half-Time & Match Overview */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <span className="text-[11px] text-muted-foreground block">Half-Time Score</span>
              <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
                {match.half_time_score || "N/A"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <span className="text-[11px] text-muted-foreground block">Total Match Goals</span>
              <span className="text-base font-bold font-mono text-primary mt-0.5 block">
                {match.total_goals}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <span className="text-[11px] text-muted-foreground block">Both Teams Scored</span>
              <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
                {match.home_goals > 0 && match.away_goals > 0 ? "Yes" : "No"}
              </span>
            </div>
          </div>

          {/* 132-Column In-Match Performance Stats Grid */}
          <Card className="border-border shadow-xs">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
              <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-primary" />
                In-Match Performance Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="grid grid-cols-3 gap-2 text-center font-mono font-semibold text-xs border-b border-border pb-1.5 text-muted-foreground">
                <span className="text-foreground truncate">{match.home_team}</span>
                <span className="font-sans text-[11px] font-normal">Metric</span>
                <span className="text-foreground truncate">{match.away_team}</span>
              </div>

              {[
                { label: "Total Shots", h: match.stats.home_shots, a: match.stats.away_shots },
                { label: "Shots on Target", h: match.stats.home_shots_on_target, a: match.stats.away_shots_on_target },
                { label: "Corners Won", h: match.stats.home_corners, a: match.stats.away_corners },
                { label: "Fouls Committed", h: match.stats.home_fouls, a: match.stats.away_fouls },
                { label: "Yellow Cards", h: match.stats.home_yellow, a: match.stats.away_yellow },
                { label: "Red Cards", h: match.stats.home_red, a: match.stats.away_red },
                { label: "Offsides", h: match.stats.home_offsides, a: match.stats.away_offsides },
                { label: "Woodwork Hits", h: match.stats.home_hit_woodwork, a: match.stats.away_hit_woodwork },
                { label: "Expected Goals (xG)", h: match.stats.home_xg, a: match.stats.away_xg },
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 text-center font-mono text-xs items-center py-1">
                  <span className="font-bold text-foreground">{row.h ?? "—"}</span>
                  <span className="font-sans text-[11px] text-muted-foreground">{row.label}</span>
                  <span className="font-bold text-foreground">{row.a ?? "—"}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Market Pre-Match & Closing Odds */}
          <Card className="border-border shadow-xs">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/20">
              <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                Market-Average Bookmaker Odds &amp; Lines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 font-mono">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Pre-Match (H)</span>
                  <span className="text-sm font-bold text-foreground">{match.odds.home?.toFixed(2) || "—"}</span>
                  {match.odds.home_max && (
                    <span className="text-[10px] text-muted-foreground block">Max: {match.odds.home_max.toFixed(2)}</span>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Pre-Match (D)</span>
                  <span className="text-sm font-bold text-foreground">{match.odds.draw?.toFixed(2) || "—"}</span>
                  {match.odds.draw_max && (
                    <span className="text-[10px] text-muted-foreground block">Max: {match.odds.draw_max.toFixed(2)}</span>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Pre-Match (A)</span>
                  <span className="text-sm font-bold text-foreground">{match.odds.away?.toFixed(2) || "—"}</span>
                  {match.odds.away_max && (
                    <span className="text-[10px] text-muted-foreground block">Max: {match.odds.away_max.toFixed(2)}</span>
                  )}
                </div>
              </div>

              {/* Closing Odds */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-muted/20 border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Closing Home</span>
                  <span className="font-semibold text-foreground">{match.odds.home_close?.toFixed(2) || "—"}</span>
                </div>
                <div className="p-2 rounded bg-muted/20 border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Closing Draw</span>
                  <span className="font-semibold text-foreground">{match.odds.draw_close?.toFixed(2) || "—"}</span>
                </div>
                <div className="p-2 rounded bg-muted/20 border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Closing Away</span>
                  <span className="font-semibold text-foreground">{match.odds.away_close?.toFixed(2) || "—"}</span>
                </div>
              </div>

              {/* Over / Under 2.5 & Asian Handicap */}
              <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-border">
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Over / Under 2.5</span>
                  <span className="font-bold text-orange-500">
                    O: {match.odds.over_2_5?.toFixed(2) || "—"} / U: {match.odds.under_2_5?.toFixed(2) || "—"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                  <span className="text-[10px] text-muted-foreground block font-sans">Asian Handicap Line</span>
                  <span className="font-bold text-foreground">
                    {match.odds.handicap !== null && match.odds.handicap !== undefined
                      ? `${match.odds.handicap > 0 ? `+${match.odds.handicap}` : match.odds.handicap} (${match.odds.handicap_home?.toFixed(2) || "—"} / ${match.odds.handicap_away?.toFixed(2) || "—"})`
                      : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* JSON View / Copy Toggle */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowJson(!showJson)}
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>{showJson ? "Hide Raw JSON" : "View Raw JSON Record"}</span>
              </Button>

              <Button
                variant="outline"
                size="xs"
                onClick={handleCopyJson}
                className="text-xs gap-1.5"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy JSON"}</span>
              </Button>
            </div>

            {showJson && (
              <pre className="p-3 rounded-xl bg-muted/60 border border-border text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
                {JSON.stringify(match, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onSelectTeamForAnalysis && (
              <>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    onSelectTeamForAnalysis(match.home_team);
                    onClose();
                  }}
                  className="text-xs"
                >
                  Analyze {match.home_team}
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    onSelectTeamForAnalysis(match.away_team);
                    onClose();
                  }}
                  className="text-xs"
                >
                  Analyze {match.away_team}
                </Button>
              </>
            )}
          </div>

          {onPredictMatchup && (
            <Button
              variant="default"
              size="xs"
              onClick={() => {
                onPredictMatchup(match.home_team, match.away_team);
                onClose();
              }}
              className="text-xs gap-1 font-semibold"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Predict Matchup</span>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
