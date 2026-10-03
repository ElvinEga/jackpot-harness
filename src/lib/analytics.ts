import type { Match, Bookmaker } from "./types";

export interface ResultDistribution {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface BookmakerStat {
  bookmaker: Bookmaker;
  total: number;
  homeRate: number;
  drawRate: number;
  awayRate: number;
  postponedCount: number;
  avgOdds: number | null;
}

export interface JackpotStat {
  jackpot: string;
  bookmaker: Bookmaker;
  total: number;
  homeRate: number;
  drawRate: number;
  awayRate: number;
  avgOdds: number | null;
}

export interface GoalsStat {
  totalAnalyzed: number;
  avgGoals: number;
  over15Rate: number;
  over25Rate: number;
  over35Rate: number;
  exactScores: { score: string; count: number; percentage: number }[];
  goalHistogram: { goals: string; count: number }[];
}

export interface OddsBandStat {
  band: string;
  count: number;
  homeCount: number;
  drawCount: number;
  awayCount: number;
  homeRate: number;
  drawRate: number;
  awayRate: number;
}

export interface TimelineStat {
  period: string;
  betika: number;
  mozzart: number;
  sportpesa: number;
  total: number;
}

export interface CoverageStat {
  total: number;
  missingDate: number;
  missingOdds: number;
  missingScore: number;
  postponedOrAbandoned: number;
  topLeagues: { name: string; count: number }[];
  topTeams: { name: string; count: number }[];
}

/**
 * Deduplicates overlapping Mozzart extract batches on (date, home_team, away_team).
 * Other bookmakers remain intact.
 */
export function deduplicateMatches(matches: Match[], dedupMozzartOnly = true): Match[] {
  const seenMozzart = new Set<string>();
  const seenAll = new Set<string>();

  return matches.filter((m) => {
    if (dedupMozzartOnly) {
      if (m.bookmaker === "mozzart") {
        const key = `${m.date || "nodate"}|${m.home_team.toLowerCase()}|${m.away_team.toLowerCase()}`;
        if (seenMozzart.has(key)) return false;
        seenMozzart.add(key);
      }
      return true;
    } else {
      const key = `${m.bookmaker}|${m.date || "nodate"}|${m.home_team.toLowerCase()}|${m.away_team.toLowerCase()}`;
      if (seenAll.has(key)) return false;
      seenAll.add(key);
      return true;
    }
  });
}

export function getResultDistribution(matches: Match[]): ResultDistribution[] {
  let home = 0;
  let draw = 0;
  let away = 0;
  let postponed = 0;
  let other = 0;

  for (const m of matches) {
    if (m.result === "home") home++;
    else if (m.result === "draw") draw++;
    else if (m.result === "away") away++;
    else if (m.result === "postponed" || m.result === "abandoned") postponed++;
    else other++;
  }

  const total = matches.length || 1;
  return [
    { name: "Home Win", count: home, percentage: (home / total) * 100, color: "#0d9488" },
    { name: "Draw", count: draw, percentage: (draw / total) * 100, color: "#cbd5e1" },
    { name: "Away Win", count: away, percentage: (away / total) * 100, color: "#64748b" },
    { name: "Postp / Abn", count: postponed, percentage: (postponed / total) * 100, color: "#475569" },
    ...(other > 0 ? [{ name: "Other / Unknown", count: other, percentage: (other / total) * 100, color: "#64748b" }] : []),
  ];
}

export function getBookmakerStats(matches: Match[]): BookmakerStat[] {
  const bookmakers: Bookmaker[] = ["betika", "mozzart", "sportpesa"];

  return bookmakers.map((b) => {
    const list = matches.filter((m) => m.bookmaker === b);
    const validResults = list.filter((m) => m.result === "home" || m.result === "draw" || m.result === "away");
    const count = validResults.length || 1;

    const home = validResults.filter((m) => m.result === "home").length;
    const draw = validResults.filter((m) => m.result === "draw").length;
    const away = validResults.filter((m) => m.result === "away").length;
    const postp = list.filter((m) => m.result === "postponed" || m.result === "abandoned").length;

    const oddsList = list.map((m) => m.odds).filter((o): o is number => o !== null);
    const avgOdds = oddsList.length ? oddsList.reduce((acc, v) => acc + v, 0) / oddsList.length : null;

    return {
      bookmaker: b,
      total: list.length,
      homeRate: (home / count) * 100,
      drawRate: (draw / count) * 100,
      awayRate: (away / count) * 100,
      postponedCount: postp,
      avgOdds,
    };
  });
}

export function getJackpotStats(matches: Match[]): JackpotStat[] {
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    if (!grouped[m.jackpot]) grouped[m.jackpot] = [];
    grouped[m.jackpot].push(m);
  }

  return Object.entries(grouped)
    .map(([jackpot, list]) => {
      const valid = list.filter((m) => m.result === "home" || m.result === "draw" || m.result === "away");
      const count = valid.length || 1;
      const oddsList = list.map((m) => m.odds).filter((o): o is number => o !== null);

      return {
        jackpot,
        bookmaker: list[0]?.bookmaker || "betika",
        total: list.length,
        homeRate: (valid.filter((m) => m.result === "home").length / count) * 100,
        drawRate: (valid.filter((m) => m.result === "draw").length / count) * 100,
        awayRate: (valid.filter((m) => m.result === "away").length / count) * 100,
        avgOdds: oddsList.length ? oddsList.reduce((a, b) => a + b, 0) / oddsList.length : null,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function getGoalsStats(matches: Match[]): GoalsStat {
  const scoreRegex = /^(\d+)-(\d+)$/;
  const scoreCounts: Record<string, number> = {};
  const goalBins: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let analyzed = 0;
  let totalGoalsSum = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;

  for (const m of matches) {
    if (!m.score) continue;
    const match = m.score.match(scoreRegex);
    if (!match) continue;

    const h = parseInt(match[1], 10);
    const a = parseInt(match[2], 10);
    const totalGoals = h + a;

    analyzed++;
    totalGoalsSum += totalGoals;

    if (totalGoals > 1.5) over15++;
    if (totalGoals > 2.5) over25++;
    if (totalGoals > 3.5) over35++;

    const binKey = Math.min(totalGoals, 6);
    goalBins[binKey] = (goalBins[binKey] || 0) + 1;

    scoreCounts[m.score] = (scoreCounts[m.score] || 0) + 1;
  }

  const exactScores = Object.entries(scoreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([score, count]) => ({
      score,
      count,
      percentage: analyzed ? (count / analyzed) * 100 : 0,
    }));

  const goalHistogram = [
    { goals: "0 goals", count: goalBins[0] || 0 },
    { goals: "1 goal", count: goalBins[1] || 0 },
    { goals: "2 goals", count: goalBins[2] || 0 },
    { goals: "3 goals", count: goalBins[3] || 0 },
    { goals: "4 goals", count: goalBins[4] || 0 },
    { goals: "5 goals", count: goalBins[5] || 0 },
    { goals: "6+ goals", count: goalBins[6] || 0 },
  ];

  return {
    totalAnalyzed: analyzed,
    avgGoals: analyzed ? totalGoalsSum / analyzed : 0,
    over15Rate: analyzed ? (over15 / analyzed) * 100 : 0,
    over25Rate: analyzed ? (over25 / analyzed) * 100 : 0,
    over35Rate: analyzed ? (over35 / analyzed) * 100 : 0,
    exactScores,
    goalHistogram,
  };
}

export function getOddsBandStats(matches: Match[]): OddsBandStat[] {
  const bands = [
    { name: "< 1.50", min: 0, max: 1.499 },
    { name: "1.50 - 1.79", min: 1.5, max: 1.799 },
    { name: "1.80 - 2.19", min: 1.8, max: 2.199 },
    { name: "2.20 - 2.69", min: 2.2, max: 2.699 },
    { name: "2.70 - 3.49", min: 2.7, max: 3.499 },
    { name: "3.50+", min: 3.5, max: Infinity },
  ];

  return bands.map((band) => {
    const list = matches.filter((m) => m.odds !== null && m.odds >= band.min && m.odds <= band.max);
    const valid = list.filter((m) => m.result === "home" || m.result === "draw" || m.result === "away");
    const count = valid.length || 1;

    const home = valid.filter((m) => m.result === "home").length;
    const draw = valid.filter((m) => m.result === "draw").length;
    const away = valid.filter((m) => m.result === "away").length;

    return {
      band: band.name,
      count: list.length,
      homeCount: home,
      drawCount: draw,
      awayCount: away,
      homeRate: (home / count) * 100,
      drawRate: (draw / count) * 100,
      awayRate: (away / count) * 100,
    };
  });
}

export function getCoverageStats(matches: Match[]): CoverageStat {
  let missingDate = 0;
  let missingOdds = 0;
  let missingScore = 0;
  let postponedOrAbandoned = 0;

  const leagues: Record<string, number> = {};
  const teams: Record<string, number> = {};

  for (const m of matches) {
    if (!m.date) missingDate++;
    if (m.odds === null) missingOdds++;
    if (!m.score) missingScore++;
    if (m.result === "postponed" || m.result === "abandoned") postponedOrAbandoned++;

    if (m.league) {
      leagues[m.league] = (leagues[m.league] || 0) + 1;
    }
    if (m.home_team) {
      teams[m.home_team] = (teams[m.home_team] || 0) + 1;
    }
    if (m.away_team) {
      teams[m.away_team] = (teams[m.away_team] || 0) + 1;
    }
  }

  const topLeagues = Object.entries(leagues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topTeams = Object.entries(teams)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return {
    total: matches.length,
    missingDate,
    missingOdds,
    missingScore,
    postponedOrAbandoned,
    topLeagues,
    topTeams,
  };
}

export function getTimelineStats(matches: Match[]): TimelineStat[] {
  const periodMap: Record<string, { betika: number; mozzart: number; sportpesa: number; total: number }> = {};

  for (const m of matches) {
    if (!m.date) continue;
    // Group by Year-Month or Year
    const year = m.date.slice(0, 4);
    if (!periodMap[year]) {
      periodMap[year] = { betika: 0, mozzart: 0, sportpesa: 0, total: 0 };
    }
    periodMap[year][m.bookmaker]++;
    periodMap[year].total++;
  }

  return Object.entries(periodMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, counts]) => ({
      period: year,
      betika: counts.betika,
      mozzart: counts.mozzart,
      sportpesa: counts.sportpesa,
      total: counts.total,
    }));
}
