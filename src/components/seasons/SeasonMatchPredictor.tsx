import React, { useState, useMemo } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TeamLogo } from "@/components/TeamLogo";
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
    if (allTeams.includes("Millwall") || allTeams.includes("QPR")) {
      return [
        { home: "Millwall", away: "QPR" },
        { home: "QPR", away: "Millwall" },
        { home: "Preston", away: "Blackburn" },
        { home: "Coventry", away: "Birmingham" },
        { home: "Stoke", away: "Derby" },
        { home: "Cardiff", away: "Swansea" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
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
    if (allTeams.includes("Sp Gijon") || allTeams.includes("Oviedo")) {
      return [
        { home: "Sp Gijon", away: "Oviedo" },
        { home: "Huesca", away: "Zaragoza" },
        { home: "Burgos", away: "Mirandes" },
        { home: "Las Palmas", away: "Tenerife" },
        { home: "Malaga", away: "Cadiz" },
        { home: "La Coruna", away: "Ferrol" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Bayern Munich")) {
      return [
        { home: "Bayern Munich", away: "Dortmund" },
        { home: "Dortmund", away: "Bayern Munich" },
        { home: "Leverkusen", away: "Bayern Munich" },
        { home: "RB Leipzig", away: "Dortmund" },
        { home: "Ein Frankfurt", away: "Bayern Munich" },
        { home: "Stuttgart", away: "Leverkusen" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Nurnberg") || allTeams.includes("Hamburg")) {
      return [
        { home: "Hamburg", away: "St Pauli" },
        { home: "Nurnberg", away: "Greuther Furth" },
        { home: "Braunschweig", away: "Hannover" },
        { home: "Kaiserslautern", away: "Karlsruhe" },
        { home: "Holstein Kiel", away: "Hamburg" },
        { home: "FC Koln", away: "Fortuna Dusseldorf" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Inter") || allTeams.includes("Juventus")) {
      return [
        { home: "Inter", away: "Milan" },
        { home: "Juventus", away: "Inter" },
        { home: "Roma", away: "Lazio" },
        { home: "Milan", away: "Juventus" },
        { home: "Juventus", away: "Torino" },
        { home: "Napoli", away: "Roma" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Palermo") || allTeams.includes("Sampdoria")) {
      return [
        { home: "Palermo", away: "Bari" },
        { home: "Palermo", away: "Catanzaro" },
        { home: "Reggiana", away: "Modena" },
        { home: "Modena", away: "Parma" },
        { home: "Cittadella", away: "Venezia" },
        { home: "Palermo", away: "Sudtirol" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Paris SG") || allTeams.includes("Marseille")) {
      return [
        { home: "Paris SG", away: "Marseille" },
        { home: "Lyon", away: "Marseille" },
        { home: "Lens", away: "Lille" },
        { home: "Monaco", away: "Paris SG" },
        { home: "Lyon", away: "Paris SG" },
        { home: "Monaco", away: "Nice" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Clermont") || allTeams.includes("Bastia")) {
      return [
        { home: "Ajaccio", away: "Bastia" },
        { home: "Pau FC", away: "Rodez" },
        { home: "Guingamp", away: "Bastia" },
        { home: "Amiens", away: "Dunkerque" },
        { home: "Laval", away: "Le Mans" },
        { home: "Clermont", away: "Grenoble" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Ajax") || allTeams.includes("Feyenoord")) {
      return [
        { home: "Ajax", away: "Feyenoord" },
        { home: "Ajax", away: "PSV Eindhoven" },
        { home: "PSV Eindhoven", away: "Feyenoord" },
        { home: "AZ Alkmaar", away: "Ajax" },
        { home: "Twente", away: "Ajax" },
        { home: "Utrecht", away: "Feyenoord" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Benfica") || allTeams.includes("Porto")) {
      return [
        { home: "Benfica", away: "Porto" },
        { home: "Benfica", away: "Sp Lisbon" },
        { home: "Porto", away: "Sp Lisbon" },
        { home: "Sp Braga", away: "Guimaraes" },
        { home: "Sp Braga", away: "Benfica" },
        { home: "Porto", away: "Sp Braga" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Club Brugge") || allTeams.includes("Anderlecht")) {
      return [
        { home: "Club Brugge", away: "Anderlecht" },
        { home: "Cercle Brugge", away: "Club Brugge" },
        { home: "Standard", away: "Anderlecht" },
        { home: "Genk", away: "Gent" },
        { home: "Antwerp", away: "Club Brugge" },
        { home: "St. Gilloise", away: "Anderlecht" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Celtic") || allTeams.includes("Rangers")) {
      return [
        { home: "Celtic", away: "Rangers" },
        { home: "Rangers", away: "Celtic" },
        { home: "Hearts", away: "Hibernian" },
        { home: "Hibernian", away: "Hearts" },
        { home: "Dundee United", away: "Dundee" },
        { home: "Aberdeen", away: "Dundee" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Dunfermline") || allTeams.includes("Raith Rvs")) {
      return [
        { home: "Ayr", away: "Morton" },
        { home: "Dunfermline", away: "Raith Rvs" },
        { home: "Partick", away: "Queens Park" },
        { home: "Arbroath", away: "Raith Rvs" },
        { home: "Ayr", away: "Queens Park" },
        { home: "Inverness C", away: "Hamilton" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Galatasaray") || allTeams.includes("Fenerbahce")) {
      return [
        { home: "Galatasaray", away: "Fenerbahce" },
        { home: "Fenerbahce", away: "Galatasaray" },
        { home: "Besiktas", away: "Galatasaray" },
        { home: "Galatasaray", away: "Besiktas" },
        { home: "Trabzonspor", away: "Fenerbahce" },
        { home: "Buyuksehyr", away: "Besiktas" },
      ].filter((p) => allTeams.includes(p.home) && allTeams.includes(p.away));
    }
    if (allTeams.includes("Olympiakos") || allTeams.includes("Panathinaikos")) {
      return [
        { home: "Olympiakos", away: "Panathinaikos" },
        { home: "Panathinaikos", away: "Olympiakos" },
        { home: "AEK", away: "PAOK" },
        { home: "PAOK", away: "AEK" },
        { home: "PAOK", away: "Aris" },
        { home: "Olympiakos", away: "AEK" },
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
      {/* Distilled Matchup Command & Probability Panel */}
      <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
        {/* Matchup Selector & Derby Presets Bar */}
        <div className="px-4 py-2.5 border-b border-border bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            {/* Home Select */}
            <div className="flex-1 min-w-36">
              <SearchableSelect
                value={homeTeam}
                onValueChange={setHomeTeam}
                options={allTeams.map((t) => ({
                  value: t,
                  label: t,
                  disabled: t === awayTeam,
                }))}
                searchPlaceholder="Search home team..."
                placeholder="Select home team..."
                className="w-full h-8 font-semibold text-xs"
                popoverWidth="w-56"
              />
            </div>

            {/* Swap Button */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handleSwap}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              title="Swap Home and Away teams"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Away Select */}
            <div className="flex-1 min-w-36">
              <SearchableSelect
                value={awayTeam}
                onValueChange={setAwayTeam}
                options={allTeams.map((t) => ({
                  value: t,
                  label: t,
                  disabled: t === homeTeam,
                }))}
                searchPlaceholder="Search away team..."
                placeholder="Select away team..."
                className="w-full h-8 font-semibold text-xs"
                popoverWidth="w-56"
              />
            </div>
          </div>

          {/* Quick Derby Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 py-0.5">
            <span className="text-[11px] text-muted-foreground font-medium shrink-0">Popular Matchups:</span>
            {presetMatchups.slice(0, 6).map((pair) => {
              const isActive = homeTeam === pair.home && awayTeam === pair.away;
              return (
                <button
                  key={`${pair.home}-${pair.away}`}
                  type="button"
                  onClick={() => {
                    setHomeTeam(pair.home);
                    setAwayTeam(pair.away);
                  }}
                  className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors border shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                  }`}
                >
                  {pair.home} v {pair.away}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scoreboard Fixture Banner */}
        <div className="px-4 py-3 bg-muted/20 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex items-center gap-3 flex-1">
            <TeamLogo team={prediction.homeTeam} size={30} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-foreground tracking-tight">
                  {prediction.homeTeam}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  Home Venue
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span>Expected Goals:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {prediction.expectedHomeGoals}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Result Badge */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <Badge
              variant="default"
              className={`text-xs font-semibold px-3 py-1 ${
                prediction.predictedResult === "home"
                  ? "bg-emerald-600 text-white hover:bg-emerald-600"
                  : prediction.predictedResult === "draw"
                  ? "bg-amber-600 text-white hover:bg-amber-600"
                  : "bg-blue-600 text-white hover:bg-blue-600"
              }`}
            >
              {prediction.predictedResult === "home"
                ? `${prediction.homeTeam} Win`
                : prediction.predictedResult === "draw"
                ? "Draw Projected"
                : `${prediction.awayTeam} Win`}{" "}
              <span className="opacity-80 font-normal ml-1">({prediction.confidence} Confidence)</span>
            </Badge>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              Expected Total: {prediction.totalExpectedGoals} goals
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-start md:justify-end gap-3 flex-1 text-left md:text-right">
            <div className="order-2 md:order-1">
              <div className="flex items-center justify-start md:justify-end gap-1.5">
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                  Away Venue
                </span>
                <span className="font-bold text-base text-foreground tracking-tight">
                  {prediction.awayTeam}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-start md:justify-end gap-1">
                <span>Expected Goals:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {prediction.expectedAwayGoals}
                </span>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <TeamLogo team={prediction.awayTeam} size={30} />
            </div>
          </div>
        </div>

        {/* Integrated 1X2 Probability Distribution Bar & Outcome Cards */}
        <div className="p-3 bg-card space-y-2">
          {/* Proportional Segmented Probability Bar */}
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
            <div
              style={{ width: `${prediction.homeProb}%` }}
              className="bg-emerald-500 transition-all duration-300"
              title={`Home Win (${prediction.homeTeam}): ${prediction.homeProb}%`}
            />
            <div
              style={{ width: `${prediction.drawProb}%` }}
              className="bg-amber-500 transition-all duration-300"
              title={`Draw: ${prediction.drawProb}%`}
            />
            <div
              style={{ width: `${prediction.awayProb}%` }}
              className="bg-blue-500 transition-all duration-300"
              title={`Away Win (${prediction.awayTeam}): ${prediction.awayProb}%`}
            />
          </div>

          {/* 3 Outcome Pillars */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                1 ({prediction.homeTeam})
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-bold text-foreground text-sm">{prediction.homeProb}%</span>
                <span className="text-[10px] text-muted-foreground">
                  (Fair Odds: {(100 / (prediction.homeProb || 1)).toFixed(2)})
                </span>
              </div>
            </div>

            <div className="py-1.5 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                X (Draw)
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-bold text-foreground text-sm">{prediction.drawProb}%</span>
                <span className="text-[10px] text-muted-foreground">
                  (Fair Odds: {(100 / (prediction.drawProb || 1)).toFixed(2)})
                </span>
              </div>
            </div>

            <div className="py-1.5 px-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">
                2 ({prediction.awayTeam})
              </span>
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-bold text-foreground text-sm">{prediction.awayProb}%</span>
                <span className="text-[10px] text-muted-foreground">
                  (Fair Odds: {(100 / (prediction.awayProb || 1)).toFixed(2)})
                </span>
              </div>
            </div>
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
                Estimated probability for each scoreline (Home 0–5 vs Away 0–5)
              </p>
            </div>
            <span className="text-xs font-medium text-primary">
              Most Likely: {prediction.mostLikelyScores[0]?.score} ({prediction.mostLikelyScores[0]?.prob}%)
            </span>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-xs text-muted-foreground font-normal">Home \ Away</th>
                  {[0, 1, 2, 3, 4, 5].map((g) => (
                    <th key={g} className="font-medium text-muted-foreground text-xs">
                      {g}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prediction.scoreMatrix.map((row, hGoals) => (
                  <tr key={hGoals}>
                    <th className="font-medium text-muted-foreground text-xs text-left">
                      {hGoals}
                    </th>
                    {row.map((cell) => {
                      const isTop = cell.score === prediction.mostLikelyScores[0]?.score;
                      // Color intensity based on prob (0% - 15%)
                      const intensity = Math.min(1, cell.prob / 14);
                      const bgStyle = isTop
                        ? "bg-primary text-primary-foreground font-medium shadow-xs"
                        : cell.homeGoals > cell.awayGoals
                        ? `bg-emerald-500/[${(intensity * 0.35).toFixed(2)}] text-foreground`
                        : cell.homeGoals === cell.awayGoals
                        ? `bg-amber-500/[${(intensity * 0.35).toFixed(2)}] text-foreground`
                        : `bg-blue-500/[${(intensity * 0.35).toFixed(2)}] text-foreground`;

                      return (
                        <td
                          key={cell.score}
                          className={`border border-border/50 text-xs tabular-nums font-medium transition-colors ${bgStyle}`}
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
                  <span className="font-bold text-xs block">{sc.score}</span>
                  <span className="text-[10px] block opacity-85">{sc.prob}%</span>
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
                <div className="flex justify-between">
                  <span>Over 1.5 Goals</span>
                  <span className="font-bold text-foreground">{prediction.over15Prob}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${prediction.over15Prob}%` }} />
                </div>
              </div>

              {/* Over 2.5 Goals */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Over 2.5 Goals</span>
                  <span className="font-bold text-foreground">{prediction.over25Prob}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: `${prediction.over25Prob}%` }} />
                </div>
              </div>

              {/* Over 3.5 Goals */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Over 3.5 Goals</span>
                  <span className="font-bold text-foreground">{prediction.over35Prob}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="bg-destructive h-full rounded-full" style={{ width: `${prediction.over35Prob}%` }} />
                </div>
              </div>

              {/* BTTS */}
              <div className="space-y-1 pt-2 border-t border-border">
                <div className="flex justify-between">
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
                  className={`text-[10px] ${
                    sig.favor === "home"
                      ? "text-emerald-500 border-emerald-500/30"
                      : sig.favor === "away"
                      ? "text-blue-500 border-blue-500/30"
                      : "text-amber-600 dark:text-amber-400 border-amber-500/30"
                  }`}
                >
                  {sig.favor === "home"
                    ? `Favors ${prediction.homeTeam}`
                    : sig.favor === "away"
                    ? `Favors ${prediction.awayTeam}`
                    : "Neutral / Even"}
                </Badge>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
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
