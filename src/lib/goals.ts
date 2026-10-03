import type { Match, MonthGoalStat, DayGoalStat } from "./types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function computeMonthlyGoalStats(matches: Match[]): MonthGoalStat[] {
  const monthMap = new Map<number, {
    matches: number;
    totalGoals: number;
    homeGoals: number;
    awayGoals: number;
    over15: number;
    over25: number;
    btts: number;
  }>();

  for (let m = 1; m <= 12; m++) {
    monthMap.set(m, {
      matches: 0,
      totalGoals: 0,
      homeGoals: 0,
      awayGoals: 0,
      over15: 0,
      over25: 0,
      btts: 0,
    });
  }

  for (const match of matches) {
    if (!match.date || match.home_goals === null || match.away_goals === null || match.total_goals === null) {
      continue;
    }

    // Extract month from ISO date "YYYY-MM-DD"
    const monthNum = parseInt(match.date.slice(5, 7), 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) continue;

    const data = monthMap.get(monthNum)!;
    data.matches++;
    data.totalGoals += match.total_goals;
    data.homeGoals += match.home_goals;
    data.awayGoals += match.away_goals;

    if (match.total_goals > 1.5) data.over15++;
    if (match.total_goals > 2.5) data.over25++;
    if (match.home_goals > 0 && match.away_goals > 0) data.btts++;
  }

  const result: MonthGoalStat[] = [];
  for (let m = 1; m <= 12; m++) {
    const d = monthMap.get(m)!;
    const count = d.matches || 1;
    result.push({
      month: m,
      monthName: MONTH_NAMES[m - 1],
      matches: d.matches,
      totalGoals: d.totalGoals,
      avgGoals: Number((d.totalGoals / count).toFixed(2)),
      avgHomeGoals: Number((d.homeGoals / count).toFixed(2)),
      avgAwayGoals: Number((d.awayGoals / count).toFixed(2)),
      over15Pct: Number(((d.over15 / count) * 100).toFixed(1)),
      over25Pct: Number(((d.over25 / count) * 100).toFixed(1)),
      bttsPct: Number(((d.btts / count) * 100).toFixed(1)),
    });
  }

  return result;
}

export function computeDailyGoalStats(matches: Match[]): DayGoalStat[] {
  const dayMap = new Map<number, {
    matches: number;
    totalGoals: number;
    over25: number;
    btts: number;
  }>();

  for (let d = 0; d < 7; d++) {
    dayMap.set(d, {
      matches: 0,
      totalGoals: 0,
      over25: 0,
      btts: 0,
    });
  }

  for (const match of matches) {
    if (!match.date || match.home_goals === null || match.away_goals === null || match.total_goals === null) {
      continue;
    }

    const [year, month, day] = match.date.split("-").map(Number);
    if (!year || !month || !day) continue;

    // Use UTC date to get reliable day of week
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = dateObj.getUTCDay();

    const data = dayMap.get(dayOfWeek);
    if (!data) continue;

    data.matches++;
    data.totalGoals += match.total_goals;
    if (match.total_goals > 2.5) data.over25++;
    if (match.home_goals > 0 && match.away_goals > 0) data.btts++;
  }

  // Order starting with Monday (1..6, 0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];
  const result: DayGoalStat[] = [];

  for (const d of orderedDays) {
    const data = dayMap.get(d)!;
    const count = data.matches || 1;
    result.push({
      dayOfWeek: d,
      dayName: DAY_NAMES[d],
      matches: data.matches,
      avgGoals: Number((data.totalGoals / count).toFixed(2)),
      over25Pct: Number(((data.over25 / count) * 100).toFixed(1)),
      bttsPct: Number(((data.btts / count) * 100).toFixed(1)),
    });
  }

  return result;
}

export function computeScoreDistribution(matches: Match[], topLimit = 10) {
  const counts = new Map<string, number>();
  let totalScored = 0;

  for (const m of matches) {
    if (m.score && m.home_goals !== null && m.away_goals !== null) {
      const s = m.score.trim();
      counts.set(s, (counts.get(s) || 0) + 1);
      totalScored++;
    }
  }

  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topLimit)
    .map(([score, count]) => ({
      score,
      count,
      pct: Number(((count / (totalScored || 1)) * 100).toFixed(1)),
    }));

  return {
    totalScored,
    topScores: sorted,
  };
}
