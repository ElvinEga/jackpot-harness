import type {
  SeasonMatch,
  LeagueStandingRow,
  TeamSeasonProfile,
  SeasonComparisonRow,
  CalendarMonthStat,
  CalendarDayStat,
} from "./seasonTypes";

const MONTH_NAMES: Record<string, string> = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Extracts a unique, alphabetically sorted list of teams present in the given matches.
 */
export function getAllSeasonTeams(matches: SeasonMatch[]): string[] {
  const set = new Set<string>();
  for (const m of matches) {
    if (m.home_team) set.add(m.home_team);
    if (m.away_team) set.add(m.away_team);
  }
  return Array.from(set).sort();
}

/**
 * Computes official league table standings from a set of matches.
 */
export function computeStandings(matches: SeasonMatch[]): LeagueStandingRow[] {
  const teamsMap = new Map<
    string,
    {
      team: string;
      played: number;
      won: number;
      drawn: number;
      lost: number;
      gf: number;
      ga: number;
      pts: number;
      homePlayed: number;
      homeWon: number;
      homeDrawn: number;
      homeLost: number;
      homeGF: number;
      homeGA: number;
      homePts: number;
      awayPlayed: number;
      awayWon: number;
      awayDrawn: number;
      awayLost: number;
      awayGF: number;
      awayGA: number;
      awayPts: number;
      recentMatches: { date: string; result: "W" | "D" | "L" }[];
    }
  >();

  const getOrCreate = (team: string) => {
    if (!teamsMap.has(team)) {
      teamsMap.set(team, {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        pts: 0,
        homePlayed: 0,
        homeWon: 0,
        homeDrawn: 0,
        homeLost: 0,
        homeGF: 0,
        homeGA: 0,
        homePts: 0,
        awayPlayed: 0,
        awayWon: 0,
        awayDrawn: 0,
        awayLost: 0,
        awayGF: 0,
        awayGA: 0,
        awayPts: 0,
        recentMatches: [],
      });
    }
    return teamsMap.get(team)!;
  };

  // Sort matches chronologically to track form correctly
  const sortedMatches = [...matches].sort((a, b) => a.date.localeCompare(b.date));

  for (const m of sortedMatches) {
    const h = getOrCreate(m.home_team);
    const a = getOrCreate(m.away_team);

    h.played++;
    a.played++;
    h.homePlayed++;
    a.awayPlayed++;

    h.gf += m.home_goals;
    h.ga += m.away_goals;
    h.homeGF += m.home_goals;
    h.homeGA += m.away_goals;

    a.gf += m.away_goals;
    a.ga += m.home_goals;
    a.awayGF += m.away_goals;
    a.awayGA += m.home_goals;

    if (m.result === "home") {
      h.won++;
      h.pts += 3;
      h.homeWon++;
      h.homePts += 3;
      a.lost++;
      a.awayLost++;
      h.recentMatches.push({ date: m.date, result: "W" });
      a.recentMatches.push({ date: m.date, result: "L" });
    } else if (m.result === "draw") {
      h.drawn++;
      h.pts += 1;
      h.homeDrawn++;
      h.homePts += 1;
      a.drawn++;
      a.pts += 1;
      a.awayDrawn++;
      a.awayPts += 1;
      h.recentMatches.push({ date: m.date, result: "D" });
      a.recentMatches.push({ date: m.date, result: "D" });
    } else if (m.result === "away") {
      a.won++;
      a.pts += 3;
      a.awayWon++;
      a.awayPts += 3;
      h.lost++;
      h.homeLost++;
      h.recentMatches.push({ date: m.date, result: "L" });
      a.recentMatches.push({ date: m.date, result: "W" });
    }
  }

  // Sort by Points DESC, Goal Difference DESC, Goals For DESC, Team ASC
  const rows = Array.from(teamsMap.values()).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.localeCompare(b.team);
  });

  return rows.map((r, idx): LeagueStandingRow => {
    const last5 = r.recentMatches.slice(-5).map((rm) => rm.result);
    return {
      rank: idx + 1,
      team: r.team,
      played: r.played,
      won: r.won,
      drawn: r.drawn,
      lost: r.lost,
      goalsFor: r.gf,
      goalsAgainst: r.ga,
      goalDifference: r.gf - r.ga,
      points: r.pts,
      form: last5,
      homePlayed: r.homePlayed,
      homeWon: r.homeWon,
      homeDrawn: r.homeDrawn,
      homeLost: r.homeLost,
      homeGF: r.homeGF,
      homeGA: r.homeGA,
      homePoints: r.homePts,
      awayPlayed: r.awayPlayed,
      awayWon: r.awayWon,
      awayDrawn: r.awayDrawn,
      awayLost: r.awayLost,
      awayGF: r.awayGF,
      awayGA: r.awayGA,
      awayPoints: r.awayPts,
    };
  });
}

/**
 * Computes high-level aggregated metrics across a collection of season matches.
 */
export function computeSeasonOverview(matches: SeasonMatch[]) {
  const totalMatches = matches.length;
  if (totalMatches === 0) {
    return {
      totalMatches: 0,
      totalGoals: 0,
      goalsPerMatch: 0,
      homeWinPct: 0,
      drawPct: 0,
      awayWinPct: 0,
      over15Pct: 0,
      over25Pct: 0,
      over35Pct: 0,
      bttsPct: 0,
      cleanSheetPct: 0,
      avgShots: 0,
      avgShotsOnTarget: 0,
      avgCorners: 0,
      avgYellows: 0,
      avgReds: 0,
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      over25Count: 0,
      bttsCount: 0,
    };
  }

  let totalGoals = 0;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let over15 = 0;
  let over25 = 0;
  let over35 = 0;
  let btts = 0;
  let cleanSheets = 0;
  let totalShots = 0;
  let totalSot = 0;
  let totalCorners = 0;
  let totalYellows = 0;
  let totalReds = 0;

  for (const m of matches) {
    totalGoals += m.total_goals;
    if (m.result === "home") homeWins++;
    else if (m.result === "draw") draws++;
    else if (m.result === "away") awayWins++;

    if (m.total_goals > 1.5) over15++;
    if (m.total_goals > 2.5) over25++;
    if (m.total_goals > 3.5) over35++;

    if (m.home_goals > 0 && m.away_goals > 0) btts++;
    if (m.home_goals === 0 || m.away_goals === 0) cleanSheets++;

    const hs = m.stats.home_shots ?? 0;
    const as = m.stats.away_shots ?? 0;
    totalShots += hs + as;

    const hst = m.stats.home_shots_on_target ?? 0;
    const ast = m.stats.away_shots_on_target ?? 0;
    totalSot += hst + ast;

    const hc = m.stats.home_corners ?? 0;
    const ac = m.stats.away_corners ?? 0;
    totalCorners += hc + ac;

    const hy = m.stats.home_yellow ?? 0;
    const ay = m.stats.away_yellow ?? 0;
    totalYellows += hy + ay;

    const hr = m.stats.home_red ?? 0;
    const ar = m.stats.away_red ?? 0;
    totalReds += hr + ar;
  }

  return {
    totalMatches,
    totalGoals,
    goalsPerMatch: Number((totalGoals / totalMatches).toFixed(2)),
    homeWins,
    draws,
    awayWins,
    homeWinPct: Number(((homeWins / totalMatches) * 100).toFixed(1)),
    drawPct: Number(((draws / totalMatches) * 100).toFixed(1)),
    awayWinPct: Number(((awayWins / totalMatches) * 100).toFixed(1)),
    over15Pct: Number(((over15 / totalMatches) * 100).toFixed(1)),
    over25Pct: Number(((over25 / totalMatches) * 100).toFixed(1)),
    over35Pct: Number(((over35 / totalMatches) * 100).toFixed(1)),
    bttsPct: Number(((btts / totalMatches) * 100).toFixed(1)),
    cleanSheetPct: Number(((cleanSheets / totalMatches) * 100).toFixed(1)),
    avgShots: Number((totalShots / totalMatches).toFixed(1)),
    avgShotsOnTarget: Number((totalSot / totalMatches).toFixed(1)),
    avgCorners: Number((totalCorners / totalMatches).toFixed(1)),
    avgYellows: Number((totalYellows / totalMatches).toFixed(1)),
    avgReds: Number((totalReds / totalMatches).toFixed(2)),
    over25Count: over25,
    bttsCount: btts,
  };
}

/**
 * Computes deep profile analytics for a single team.
 */
export function computeTeamProfile(
  matches: SeasonMatch[],
  teamName: string,
  season = "All"
): TeamSeasonProfile | null {
  const teamMatches = matches
    .filter((m) => m.home_team === teamName || m.away_team === teamName)
    .sort((a, b) => b.date.localeCompare(a.date)); // most recent first

  if (teamMatches.length === 0) return null;

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let gf = 0;
  let ga = 0;
  let cleanSheets = 0;
  let failedToScore = 0;
  let bttsCount = 0;
  let over25Count = 0;
  let totalShots = 0;
  let totalSot = 0;
  let totalCorners = 0;
  let totalYellows = 0;
  let totalReds = 0;

  const home = { matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };
  const away = { matches: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 };

  for (const m of teamMatches) {
    const isHome = m.home_team === teamName;
    const teamGoals = isHome ? m.home_goals : m.away_goals;
    const oppGoals = isHome ? m.away_goals : m.home_goals;

    gf += teamGoals;
    ga += oppGoals;

    if (oppGoals === 0) cleanSheets++;
    if (teamGoals === 0) failedToScore++;
    if (teamGoals > 0 && oppGoals > 0) bttsCount++;
    if (m.total_goals > 2.5) over25Count++;

    const teamShots = isHome ? (m.stats.home_shots ?? 0) : (m.stats.away_shots ?? 0);
    const teamSot = isHome
      ? (m.stats.home_shots_on_target ?? 0)
      : (m.stats.away_shots_on_target ?? 0);
    const teamCorners = isHome
      ? (m.stats.home_corners ?? 0)
      : (m.stats.away_corners ?? 0);
    const teamYellows = isHome
      ? (m.stats.home_yellow ?? 0)
      : (m.stats.away_yellow ?? 0);
    const teamReds = isHome ? (m.stats.home_red ?? 0) : (m.stats.away_red ?? 0);

    totalShots += teamShots;
    totalSot += teamSot;
    totalCorners += teamCorners;
    totalYellows += teamYellows;
    totalReds += teamReds;

    if (isHome) {
      home.matches++;
      home.gf += teamGoals;
      home.ga += oppGoals;
      if (m.result === "home") {
        wins++;
        home.wins++;
      } else if (m.result === "draw") {
        draws++;
        home.draws++;
      } else {
        losses++;
        home.losses++;
      }
    } else {
      away.matches++;
      away.gf += teamGoals;
      away.ga += oppGoals;
      if (m.result === "away") {
        wins++;
        away.wins++;
      } else if (m.result === "draw") {
        draws++;
        away.draws++;
      } else {
        losses++;
        away.losses++;
      }
    }
  }

  const n = teamMatches.length;
  const pts = wins * 3 + draws;

  // Normalized rating estimates (0 - 100)
  const avgGF = gf / n;
  const avgGA = ga / n;
  const attackRating = Math.min(99, Math.max(40, Math.round(50 + (avgGF - 1.35) * 28)));
  const defenseRating = Math.min(99, Math.max(40, Math.round(50 + (1.35 - avgGA) * 28)));
  const overallRating = Math.round(attackRating * 0.5 + defenseRating * 0.5);

  return {
    team: teamName,
    season,
    totalMatches: n,
    wins,
    draws,
    losses,
    winRate: Number(((wins / n) * 100).toFixed(1)),
    points: pts,
    goalsFor: gf,
    goalsAgainst: ga,
    avgGoalsFor: Number(avgGF.toFixed(2)),
    avgGoalsAgainst: Number(avgGA.toFixed(2)),
    cleanSheets,
    cleanSheetPct: Number(((cleanSheets / n) * 100).toFixed(1)),
    failedToScore,
    bttsCount,
    bttsPct: Number(((bttsCount / n) * 100).toFixed(1)),
    over25Count,
    over25Pct: Number(((over25Count / n) * 100).toFixed(1)),
    avgShots: Number((totalShots / n).toFixed(1)),
    avgShotsOnTarget: Number((totalSot / n).toFixed(1)),
    shotAccuracyPct:
      totalShots > 0 ? Number(((totalSot / totalShots) * 100).toFixed(1)) : 0,
    avgCorners: Number((totalCorners / n).toFixed(1)),
    avgYellows: Number((totalYellows / n).toFixed(1)),
    avgReds: Number((totalReds / n).toFixed(2)),
    homeRecord: {
      ...home,
      winRate:
        home.matches > 0 ? Number(((home.wins / home.matches) * 100).toFixed(1)) : 0,
    },
    awayRecord: {
      ...away,
      winRate:
        away.matches > 0 ? Number(((away.wins / away.matches) * 100).toFixed(1)) : 0,
    },
    recentMatches: teamMatches,
    attackRating,
    defenseRating,
    overallRating,
  };
}

/**
 * Computes season-by-season comparison rows to observe league evolution.
 */
export function computeSeasonComparison(allMatches: SeasonMatch[]): SeasonComparisonRow[] {
  const seasonGroups = new Map<string, SeasonMatch[]>();
  for (const m of allMatches) {
    if (!seasonGroups.has(m.season)) {
      seasonGroups.set(m.season, []);
    }
    seasonGroups.get(m.season)!.push(m);
  }

  // Sort seasons chronologically
  const sortedKeys = Array.from(seasonGroups.keys()).sort();

  return sortedKeys.map((season) => {
    const matches = seasonGroups.get(season)!;
    const ov = computeSeasonOverview(matches);
    return {
      season,
      matches: ov.totalMatches,
      totalGoals: ov.totalGoals,
      goalsPerMatch: ov.goalsPerMatch,
      homeWinPct: ov.homeWinPct,
      drawPct: ov.drawPct,
      awayWinPct: ov.awayWinPct,
      over15Pct: ov.over15Pct,
      over25Pct: ov.over25Pct,
      over35Pct: ov.over35Pct,
      bttsPct: ov.bttsPct,
      cleanSheetPct: ov.cleanSheetPct,
      avgShotsPerMatch: ov.avgShots,
      avgCornersPerMatch: ov.avgCorners,
      avgYellowsPerMatch: ov.avgYellows,
    };
  });
}

/**
 * Computes calendar monthly and day-of-week breakdown stats.
 */
export function computeCalendarAnalytics(matches: SeasonMatch[]) {
  // Monthly grouping
  const monthMap = new Map<string, SeasonMatch[]>();
  // Day of week grouping (0 = Sunday ... 6 = Saturday)
  const dayMap = new Map<number, SeasonMatch[]>();

  for (const m of matches) {
    if (!m.date) continue;
    const monthNum = m.date.slice(5, 7);
    if (!monthMap.has(monthNum)) monthMap.set(monthNum, []);
    monthMap.get(monthNum)!.push(m);

    const d = new Date(m.date);
    const dayOfWeek = d.getUTCDay();
    if (!dayMap.has(dayOfWeek)) dayMap.set(dayOfWeek, []);
    dayMap.get(dayOfWeek)!.push(m);
  }

  // Build sorted month stats (standard European football calendar: August to May)
  const calendarOrder = ["08", "09", "10", "11", "12", "01", "02", "03", "04", "05", "06", "07"];
  const monthlyStats: CalendarMonthStat[] = [];

  for (const mNum of calendarOrder) {
    const list = monthMap.get(mNum);
    if (!list || list.length === 0) continue;
    const ov = computeSeasonOverview(list);
    monthlyStats.push({
      monthNumber: mNum,
      monthName: MONTH_NAMES[mNum] || mNum,
      matches: ov.totalMatches,
      avgGoals: ov.goalsPerMatch,
      homeWinPct: ov.homeWinPct,
      drawPct: ov.drawPct,
      awayWinPct: ov.awayWinPct,
      over25Pct: ov.over25Pct,
      bttsPct: ov.bttsPct,
    });
  }

  // Build day of week stats: Saturday, Sunday, Midweek days
  const dayStats: CalendarDayStat[] = [];
  const dayOrder = [6, 0, 1, 2, 3, 4, 5]; // Sat, Sun, Mon, Tue, Wed, Thu, Fri

  for (const dayIdx of dayOrder) {
    const list = dayMap.get(dayIdx);
    if (!list || list.length === 0) continue;
    const ov = computeSeasonOverview(list);
    dayStats.push({
      dayName: DAY_NAMES[dayIdx],
      matches: ov.totalMatches,
      avgGoals: ov.goalsPerMatch,
      homeWinPct: ov.homeWinPct,
      drawPct: ov.drawPct,
      awayWinPct: ov.awayWinPct,
      over25Pct: ov.over25Pct,
    });
  }

  return {
    monthly: monthlyStats,
    days: dayStats,
  };
}
