import React, { useState, useMemo } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { SeasonMatch } from "../../lib/seasonTypes";
import { getAllSeasonTeams } from "../../lib/seasonsAnalytics";
import { predictSeasonMatch } from "../../lib/seasonsPredictor";

interface SeasonMatchPredictorProps {
  matches: SeasonMatch[];
  defaultHomeTeam?: string;
  defaultAwayTeam?: string;
}

export const SeasonMatchPredictor: React.FC<SeasonMatchPredictorProps> = ({
  matches,
  defaultHomeTeam = "Liverpool",
  defaultAwayTeam = "Arsenal",
}) => {
  const allTeams = useMemo(() => getAllSeasonTeams(matches), [matches]);

  const [homeTeam, setHomeTeam] = useState<string>(
    allTeams.includes(defaultHomeTeam) ? defaultHomeTeam : allTeams[0] || "Liverpool"
  );
  const [awayTeam, setAwayTeam] = useState<string>(
    allTeams.includes(defaultAwayTeam) ? defaultAwayTeam : allTeams[1] || "Arsenal"
  );

  // Synchronize teams when league changes or defaults update
  React.useEffect(() => {
    if (allTeams.includes(defaultHomeTeam)) {
      setHomeTeam(defaultHomeTeam);
    } else if (allTeams.length > 0) {
      setHomeTeam(allTeams[0]);
    }

    if (allTeams.includes(defaultAwayTeam)) {
      setAwayTeam(defaultAwayTeam);
    } else if (allTeams.length > 1) {
      setAwayTeam(allTeams[1]);
    }
  }, [defaultHomeTeam, defaultAwayTeam, allTeams]);

  // Quick Preset Matches dynamically tailored to the active league
  const presetMatchups = useMemo(() => {
    if (allTeams.includes("Real Madrid")) {
      return [
        { home: "Real Madrid", away: "Barcelona" },
        { home: "Ath Madrid", away: "Real Madrid" },
        { home: "Barcelona", away: "Ath Madrid" },
        { home: "Sevilla", away: "Betis" },
        { home: "Ath Bilbao", away: "Sociedad" },
        { home: "Valencia", away: "Villarreal" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    return [
      { home: "Liverpool", away: "Arsenal" },
      { home: "Man City", away: "Liverpool" },
      { home: "Arsenal", away: "Chelsea" },
      { home: "Man United", away: "Man City" },
      { home: "Tottenham", away: "Arsenal" },
      { home: "Newcastle", away: "Aston Villa" },
    ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
  }, [allTeams]);

  const handleSwap = () => {
    setHomeTeam(awayTeam);
    setAwayTeam(homeTeam);
  };

  const prediction = useMemo(() => {
    return predictSeasonMatch(matches, homeTeam, awayTeam);
  }, [matches, homeTeam, awayTeam]);

  return (
    <div className="space-y-6">
      {/* Matchup Selection Bar */}
      <div className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Home Team */}
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Home Team
            </label>
            <NativeSelect
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="text-xs font-semibold h-9 w-full"
            >
              {allTeams.map((t) => (
                <NativeSelectOption key={t} value={t} disabled={t === awayTeam}>
                  {t}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          {/* Swap Button */}
          <div className="sm:self-end sm:mb-0.5 self-center">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleSwap}
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              title="Swap Home and Away teams"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Away Team */}
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Away Team
            </label>
            <NativeSelect
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="text-xs font-semibold h-9 w-full"
            >
              {allTeams.map((t) => (
                <NativeSelectOption key={t} value={t} disabled={t === homeTeam}>
                  {t}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <span className="text-[11px] text-muted-foreground font-medium mr-1">Derby Presets:</span>
          {presetMatchups.map((pair) => (
            <button
              key={`${pair.home}-${pair.away}`}
              type="button"
              onClick={() => {
                setHomeTeam(pair.home);
                setAwayTeam(pair.away);
              }}
              className="px-2 py-1 rounded-md text-[11px] font-medium bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors"
            >
              {pair.home} vs {pair.away}
            </button>
          ))}
        </div>
      </div>

      {/* Main Matchup Card Header */}
      <div className="p-6 rounded-2xl bg-card border border-border relative overflow-hidden shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          {/* Home Side */}
          <div className="flex-1 text-center md:text-left">
            <Badge variant="outline" className="text-[10px] font-mono mb-1 text-emerald-500 border-emerald-500/30">
              Home Advantage
            </Badge>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">{prediction.homeTeam}</h3>
            <div className="mt-1 flex items-baseline justify-center md:justify-start gap-1.5">
              <span className="text-xs text-muted-foreground">Expected Goals:</span>
              <span className="text-xl font-bold font-mono text-emerald-500">
                {prediction.expectedHomeGoals}
              </span>
            </div>
          </div>

          {/* VS & Probability Pill */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <span className="px-3 py-1 rounded-full bg-muted border border-border font-mono font-bold text-xs text-muted-foreground">
              VS
            </span>
            <div className="mt-2 text-center">
              <span className="text-[11px] text-muted-foreground block">Predicted Result</span>
              <Badge
                variant="default"
                className={`text-xs font-semibold px-2 py-0.5 mt-0.5 ${
                  prediction.predictedResult === "home"
                    ? "bg-emerald-600 text-white"
                    : prediction.predictedResult === "draw"
                    ? "bg-amber-600 text-white"
                    : "bg-blue-600 text-white"
                }`}
              >
                {prediction.predictedResult === "home"
                  ? `${prediction.homeTeam} Win`
                  : prediction.predictedResult === "draw"
                  ? "Draw"
                  : `${prediction.awayTeam} Win`}{" "}
                ({prediction.confidence} Confidence)
              </Badge>
            </div>
          </div>

          {/* Away Side */}
          <div className="flex-1 text-center md:text-right">
            <Badge variant="outline" className="text-[10px] font-mono mb-1 text-blue-500 border-blue-500/30">
              Away Side
            </Badge>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">{prediction.awayTeam}</h3>
            <div className="mt-1 flex items-baseline justify-center md:justify-end gap-1.5">
              <span className="text-xs text-muted-foreground">Expected Goals:</span>
              <span className="text-xl font-bold font-mono text-blue-500">
                {prediction.expectedAwayGoals}
              </span>
            </div>
          </div>
        </div>

        {/* 1X2 Probability Distribution Bar */}
        <div className="mt-6 pt-4 border-t border-border grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs font-semibold text-emerald-500 block mb-0.5">
              Home Win ({prediction.homeTeam})
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-500 block">
              {prediction.homeProb}%
            </span>
            <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
              Fair Odds: {(100 / (prediction.homeProb || 1)).toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs font-semibold text-amber-500 block mb-0.5">Draw</span>
            <span className="text-2xl font-bold font-mono text-amber-500 block">
              {prediction.drawProb}%
            </span>
            <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
              Fair Odds: {(100 / (prediction.drawProb || 1)).toFixed(2)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs font-semibold text-blue-500 block mb-0.5">
              Away Win ({prediction.awayTeam})
            </span>
            <span className="text-2xl font-bold font-mono text-blue-500 block">
              {prediction.awayProb}%
            </span>
            <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
              Fair Odds: {(100 / (prediction.awayProb || 1)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 6x6 Poisson Score Matrix + Goals Over/Under */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6x6 Bivariate Poisson Score Matrix */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Bivariate Poisson Score Matrix
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Exact probability for each scoreline (Home 0..5 vs Away 0..5)
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
              Top: {prediction.mostLikelyScores[0]?.score} ({prediction.mostLikelyScores[0]?.prob}%)
            </Badge>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-1 text-[10px] text-muted-foreground font-normal">Home \ Away</th>
                  {[0, 1, 2, 3, 4, 5].map((g) => (
                    <th key={g} className="p-1 font-mono font-bold text-muted-foreground text-xs">
                      {g}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prediction.scoreMatrix.map((row, hGoals) => (
                  <tr key={hGoals}>
                    <th className="p-1 font-mono font-bold text-muted-foreground text-xs text-left">
                      {hGoals}
                    </th>
                    {row.map((cell) => {
                      const isTop = cell.score === prediction.mostLikelyScores[0]?.score;
                      // Color intensity based on prob (0% - 15%)
                      const intensity = Math.min(1, cell.prob / 14);
                      const bgStyle = isTop
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : cell.homeGoals > cell.awayGoals
                        ? `bg-emerald-500/[${(intensity * 0.35).toFixed(2)}] text-foreground`
                        : cell.homeGoals === cell.awayGoals
                        ? `bg-amber-500/[${(intensity * 0.35).toFixed(2)}] text-foreground`
                        : `bg-blue-500/[${(intensity * 0.35).toFixed(2)}] text-foreground`;

                      return (
                        <td
                          key={cell.score}
                          className={`p-1.5 border border-border/50 text-[11px] font-mono transition-colors ${bgStyle}`}
                          title={`Score ${cell.score}: ${cell.prob}%`}
                        >
                          {cell.prob > 0.5 ? `${cell.prob}%` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top 5 Most Likely Scores List */}
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
              Most Likely Exact Scores:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {prediction.mostLikelyScores.map((sc, i) => (
                <div
                  key={sc.score}
                  className={`p-2 rounded-lg text-center border ${
                    i === 0 ? "bg-primary/10 border-primary text-primary" : "bg-muted/40 border-border"
                  }`}
                >
                  <span className="font-mono font-bold text-xs block">{sc.score}</span>
                  <span className="text-[10px] font-mono block opacity-85">{sc.prob}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Goals & BTTS Probabilities */}
        <div className="space-y-4 flex flex-col">
          <div className="p-4 rounded-xl bg-card border border-border space-y-3 flex-1">
            <div className="pb-2 border-b border-border">
              <h4 className="text-sm font-bold text-foreground">
                Goals &amp; Goal Line Markets
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Model derived over/under and BTTS probabilities
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Over 1.5 Goals */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span>Over 1.5 Goals</span>
                  <span className="font-bold text-foreground">{prediction.over15Prob}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${prediction.over15Prob}%` }} />
                </div>
              </div>

              {/* Over 2.5 Goals */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span>Over 2.5 Goals</span>
                  <span className="font-bold text-foreground">{prediction.over25Prob}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${prediction.over25Prob}%` }} />
                </div>
              </div>

              {/* Over 3.5 Goals */}
              <div className="space-y-1">
                <div className="flex justify-between font-mono">
                  <span>Over 3.5 Goals</span>
                  <span className="font-bold text-foreground">{prediction.over35Prob}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="bg-destructive h-full rounded-full" style={{ width: `${prediction.over35Prob}%` }} />
                </div>
              </div>

              {/* BTTS */}
              <div className="space-y-1 pt-2 border-t border-border">
                <div className="flex justify-between font-mono">
                  <span>Both Teams To Score (BTTS - Yes)</span>
                  <span className="font-bold text-emerald-500">{prediction.bttsProb}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${prediction.bttsProb}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-xs flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Total Expected Match Goals: {prediction.totalExpectedGoals}</strong>
              <p className="mt-0.5">
                The model projects a {prediction.over25Prob >= 50 ? "high-scoring" : "cagey, low-scoring"} encounter with a {prediction.bttsProb}% likelihood of both teams scoring.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Signals Underlying Factor Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground">
          Underlying Signal Breakdown &amp; Factors
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {prediction.signals.map((sig) => (
            <div key={sig.name} className="p-3 rounded-xl bg-card border border-border space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{sig.label}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono ${
                    sig.favor === "home"
                      ? "text-emerald-500 border-emerald-500/30"
                      : sig.favor === "away"
                      ? "text-blue-500 border-blue-500/30"
                      : "text-amber-500 border-amber-500/30"
                  }`}
                >
                  Favors: {sig.favor}
                </Badge>
              </div>
              <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
                <span>{prediction.homeTeam}: {sig.homeValue}</span>
                <span>{prediction.awayTeam}: {sig.awayValue}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug pt-1 border-t border-border/50">
                {sig.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
