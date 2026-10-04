import type { Match, PositionStat } from "./types";

export function computePositionStats(matches: Match[], maxPos = 17): PositionStat[] {
  const statsMap = new Map<number, {
    total: number;
    homeWins: number;
    draws: number;
    awayWins: number;
    totalGoals: number;
    homeGoals: number;
    awayGoals: number;
    scoredMatches: number;
    over15Count: number;
    over25Count: number;
    bttsCount: number;
    scores: Map<string, number>;
    homeScores: Map<string, number>;
    drawScores: Map<string, number>;
    awayScores: Map<string, number>;
  }>();

  for (let p = 1; p <= maxPos; p++) {
    statsMap.set(p, {
      total: 0,
      homeWins: 0,
      draws: 0,
      awayWins: 0,
      totalGoals: 0,
      homeGoals: 0,
      awayGoals: 0,
      scoredMatches: 0,
      over15Count: 0,
      over25Count: 0,
      bttsCount: 0,
      scores: new Map<string, number>(),
      homeScores: new Map<string, number>(),
      drawScores: new Map<string, number>(),
      awayScores: new Map<string, number>(),
    });
  }

  for (const m of matches) {
    if (!m.position || m.position < 1 || m.position > maxPos) continue;
    const stat = statsMap.get(m.position);
    if (!stat) continue;

    const res = m.result;
    if (res === "home" || res === "draw" || res === "away") {
      stat.total++;
      if (res === "home") stat.homeWins++;
      else if (res === "draw") stat.draws++;
      else if (res === "away") stat.awayWins++;
    }

    if (m.home_goals !== null && m.away_goals !== null && m.total_goals !== null) {
      stat.scoredMatches++;
      stat.homeGoals += m.home_goals;
      stat.awayGoals += m.away_goals;
      stat.totalGoals += m.total_goals;

      if (m.total_goals > 1.5) stat.over15Count++;
      if (m.total_goals > 2.5) stat.over25Count++;
      if (m.home_goals > 0 && m.away_goals > 0) stat.bttsCount++;

      if (m.score) {
        const scoreKey = m.score.trim();
        stat.scores.set(scoreKey, (stat.scores.get(scoreKey) || 0) + 1);

        if (m.home_goals > m.away_goals) {
          stat.homeScores.set(scoreKey, (stat.homeScores.get(scoreKey) || 0) + 1);
        } else if (m.home_goals === m.away_goals) {
          stat.drawScores.set(scoreKey, (stat.drawScores.get(scoreKey) || 0) + 1);
        } else {
          stat.awayScores.set(scoreKey, (stat.awayScores.get(scoreKey) || 0) + 1);
        }
      }
    }
  }

  const result: PositionStat[] = [];

  for (let p = 1; p <= maxPos; p++) {
    const s = statsMap.get(p)!;
    const tot = s.total || 1;
    const scoredTot = s.scoredMatches || 1;

    // Sort scores by occurrence
    const sortedScores = Array.from(s.scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([score, count]) => ({
        score,
        count,
        pct: Number(((count / scoredTot) * 100).toFixed(1)),
      }));

    const mostLikelyScore = sortedScores.length > 0 ? sortedScores[0].score : "1-1";

    const getTopScoreForMap = (map: Map<string, number>) => {
      if (map.size === 0) return undefined;
      const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
      const [score, count] = sorted[0];
      return {
        score,
        count,
        pct: Number(((count / scoredTot) * 100).toFixed(1)),
      };
    };

    const topHomeScore = getTopScoreForMap(s.homeScores);
    const topAwayScore = getTopScoreForMap(s.awayScores);
    const topDrawScore = getTopScoreForMap(s.drawScores);

    result.push({
      position: p,
      totalMatches: s.total,
      homeWins: s.homeWins,
      draws: s.draws,
      awayWins: s.awayWins,
      homeWinPct: Number(((s.homeWins / tot) * 100).toFixed(1)),
      drawPct: Number(((s.draws / tot) * 100).toFixed(1)),
      awayWinPct: Number(((s.awayWins / tot) * 100).toFixed(1)),
      avgGoals: Number((s.totalGoals / scoredTot).toFixed(2)),
      avgHomeGoals: Number((s.homeGoals / scoredTot).toFixed(2)),
      avgAwayGoals: Number((s.awayGoals / scoredTot).toFixed(2)),
      over15Pct: Number(((s.over15Count / scoredTot) * 100).toFixed(1)),
      over25Pct: Number(((s.over25Count / scoredTot) * 100).toFixed(1)),
      bttsPct: Number(((s.bttsCount / scoredTot) * 100).toFixed(1)),
      mostLikelyScore,
      topScores: sortedScores.slice(0, 5),
      topHomeScore,
      topAwayScore,
      topDrawScore,
    });
  }

  return result;
}

export function getPositionAnomalies(stats: PositionStat[]) {
  if (stats.length === 0) return null;

  const valid = stats.filter((s) => s.totalMatches > 20);
  if (valid.length === 0) return null;

  const highestHome = [...valid].sort((a, b) => b.homeWinPct - a.homeWinPct)[0];
  const highestDraw = [...valid].sort((a, b) => b.drawPct - a.drawPct)[0];
  const highestAway = [...valid].sort((a, b) => b.awayWinPct - a.awayWinPct)[0];
  const highestGoals = [...valid].sort((a, b) => b.avgGoals - a.avgGoals)[0];
  const lowestGoals = [...valid].sort((a, b) => a.avgGoals - b.avgGoals)[0];

  return {
    highestHome,
    highestDraw,
    highestAway,
    highestGoals,
    lowestGoals,
  };
}
