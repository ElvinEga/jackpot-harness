import type {
  SeasonMatch,
  SeasonMatchPrediction,
  SeasonPredictionSignal,
  ScoreProbabilityCell,
} from "./seasonTypes";

/**
 * Calculates factorial n!
 */
function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/**
 * Standard Poisson probability P(k; lambda)
 */
function poissonProb(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

/**
 * Dixon-Coles adjustment tau factor for low scores (0-0, 1-0, 0-1, 1-1)
 * rho is typically between -0.10 and -0.05 in top European leagues.
 */
function tauAdjustment(x: number, y: number, lambda: number, mu: number, rho = -0.08): number {
  if (x === 0 && y === 0) {
    return 1 - lambda * mu * rho;
  }
  if (x === 0 && y === 1) {
    return 1 + lambda * rho;
  }
  if (x === 1 && y === 0) {
    return 1 + mu * rho;
  }
  if (x === 1 && y === 1) {
    return 1 - rho;
  }
  return 1;
}

/**
 * Predicts a matchup between Home Team and Away Team using historical season matches.
 */
export function predictSeasonMatch(
  matches: SeasonMatch[],
  homeTeam: string,
  awayTeam: string,
  fixtureOdds?: { home?: number | null; draw?: number | null; away?: number | null }
): SeasonMatchPrediction {
  const normHome = homeTeam.trim();
  const normAway = awayTeam.trim();

  // Baseline league statistics
  const totalMatches = matches.length || 1;
  let leagueTotalHomeGoals = 0;
  let leagueTotalAwayGoals = 0;

  for (const m of matches) {
    leagueTotalHomeGoals += m.home_goals;
    leagueTotalAwayGoals += m.away_goals;
  }

  const leagueAvgHomeGoals = Math.max(1.1, leagueTotalHomeGoals / totalMatches);
  const leagueAvgAwayGoals = Math.max(0.9, leagueTotalAwayGoals / totalMatches);

  // 1. Home Team performance (home games only)
  const homeTeamHomeMatches = matches.filter((m) => m.home_team === normHome);
  const homeCount = homeTeamHomeMatches.length || 1;
  let homeGF = 0;
  let homeGA = 0;
  let homeShots = 0;
  let homeSot = 0;
  let homeCorners = 0;
  let homeYellows = 0;
  let homeWins = 0;
  let homeDraws = 0;

  for (const m of homeTeamHomeMatches) {
    homeGF += m.home_goals;
    homeGA += m.away_goals;
    homeShots += m.stats.home_shots ?? 0;
    homeSot += m.stats.home_shots_on_target ?? 0;
    homeCorners += m.stats.home_corners ?? 0;
    homeYellows += m.stats.home_yellow ?? 0;
    if (m.result === "home") homeWins++;
    else if (m.result === "draw") homeDraws++;
  }

  const homeAttack = (homeGF / homeCount) / leagueAvgHomeGoals;
  const homeDefense = (homeGA / homeCount) / leagueAvgAwayGoals;

  // 2. Away Team performance (away games only)
  const awayTeamAwayMatches = matches.filter((m) => m.away_team === normAway);
  const awayCount = awayTeamAwayMatches.length || 1;
  let awayGF = 0;
  let awayGA = 0;
  let awayShots = 0;
  let awaySot = 0;
  let awayCorners = 0;
  let awayYellows = 0;
  let awayWins = 0;
  let awayDraws = 0;

  for (const m of awayTeamAwayMatches) {
    awayGF += m.away_goals;
    awayGA += m.home_goals;
    awayShots += m.stats.away_shots ?? 0;
    awaySot += m.stats.away_shots_on_target ?? 0;
    awayCorners += m.stats.away_corners ?? 0;
    awayYellows += m.stats.away_yellow ?? 0;
    if (m.result === "away") awayWins++;
    else if (m.result === "draw") awayDraws++;
  }

  const awayAttack = (awayGF / awayCount) / leagueAvgAwayGoals;
  const awayDefense = (awayGA / awayCount) / leagueAvgHomeGoals;

  // 3. Recent Form (last 10 matches all venues)
  const recentHomeMatches = matches
    .filter((m) => m.home_team === normHome || m.away_team === normHome)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const recentAwayMatches = matches
    .filter((m) => m.home_team === normAway || m.away_team === normAway)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  let homeFormPts = 0;
  for (const m of recentHomeMatches) {
    const isH = m.home_team === normHome;
    if (isH && m.result === "home") homeFormPts += 3;
    else if (!isH && m.result === "away") homeFormPts += 3;
    else if (m.result === "draw") homeFormPts += 1;
  }
  const homeFormPpg = recentHomeMatches.length > 0 ? homeFormPts / recentHomeMatches.length : 1.35;

  let awayFormPts = 0;
  for (const m of recentAwayMatches) {
    const isH = m.home_team === normAway;
    if (isH && m.result === "home") awayFormPts += 3;
    else if (!isH && m.result === "away") awayFormPts += 3;
    else if (m.result === "draw") awayFormPts += 1;
  }
  const awayFormPpg = recentAwayMatches.length > 0 ? awayFormPts / recentAwayMatches.length : 1.35;

  // 4. Head-to-Head
  const h2hMatches = matches.filter(
    (m) =>
      (m.home_team === normHome && m.away_team === normAway) ||
      (m.home_team === normAway && m.away_team === normHome)
  );

  let h2hHomeWins = 0;
  let h2hDraws = 0;
  let h2hAwayWins = 0;
  for (const m of h2hMatches) {
    const homeIsH = m.home_team === normHome;
    if (m.result === "draw") {
      h2hDraws++;
    } else if ((homeIsH && m.result === "home") || (!homeIsH && m.result === "away")) {
      h2hHomeWins++;
    } else {
      h2hAwayWins++;
    }
  }

  // Calculate Base Expected Goals (Poisson lambdas)
  const shrinkFactor = (n: number) => Math.min(1.0, n / 15);
  const homeWeight = shrinkFactor(homeTeamHomeMatches.length);
  const awayWeight = shrinkFactor(awayTeamAwayMatches.length);

  const effHomeAttack = 1.0 + (homeAttack - 1.0) * homeWeight;
  const effAwayDefense = 1.0 + (awayDefense - 1.0) * awayWeight;
  const effAwayAttack = 1.0 + (awayAttack - 1.0) * awayWeight;
  const effHomeDefense = 1.0 + (homeDefense - 1.0) * homeWeight;

  // Baseline expected goals adjusted by form factor
  const formFactorHome = Math.max(0.75, Math.min(1.25, 0.85 + (homeFormPpg / 3) * 0.3));
  const formFactorAway = Math.max(0.75, Math.min(1.25, 0.85 + (awayFormPpg / 3) * 0.3));

  let lambdaHome = Math.max(0.4, Math.min(3.8, leagueAvgHomeGoals * effHomeAttack * effAwayDefense * formFactorHome));
  let lambdaAway = Math.max(0.3, Math.min(3.5, leagueAvgAwayGoals * effAwayAttack * effHomeDefense * formFactorAway));

  // Blend with pre-match market odds if provided
  if (fixtureOdds && fixtureOdds.home && fixtureOdds.draw && fixtureOdds.away) {
    const invH = 1 / fixtureOdds.home;
    const invD = 1 / fixtureOdds.draw;
    const invA = 1 / fixtureOdds.away;
    const overround = invH + invD + invA;
    const mktHomeProb = invH / overround;
    const mktAwayProb = invA / overround;

    // Shift lambdas towards market implied ratio
    const marketRatio = Math.max(0.3, Math.min(3.0, mktHomeProb / (mktAwayProb || 0.01)));
    const modelRatio = lambdaHome / lambdaAway;
    const blendedRatio = modelRatio * 0.65 + marketRatio * 0.35;
    const totalExpGoals = lambdaHome + lambdaAway;
    lambdaHome = (totalExpGoals * blendedRatio) / (1 + blendedRatio);
    lambdaAway = totalExpGoals - lambdaHome;
  }

  // 5. Generate 6x6 Bivariate Poisson Score Matrix (Goals 0..5)
  const maxGoals = 5;
  const matrix: ScoreProbabilityCell[][] = [];
  let sumHomeWin = 0;
  let sumDraw = 0;
  let sumAwayWin = 0;
  let sumOver15 = 0;
  let sumOver25 = 0;
  let sumOver35 = 0;
  let sumBtts = 0;

  const rawCells: { x: number; y: number; p: number }[] = [];
  let totalMatrixSum = 0;

  for (let x = 0; x <= maxGoals; x++) {
    for (let y = 0; y <= maxGoals; y++) {
      const pBasic = poissonProb(x, lambdaHome) * poissonProb(y, lambdaAway);
      const adj = tauAdjustment(x, y, lambdaHome, lambdaAway);
      const p = Math.max(0, pBasic * adj);
      rawCells.push({ x, y, p });
      totalMatrixSum += p;
    }
  }

  // Normalize so matrix sums to 100%
  const normFactor = totalMatrixSum > 0 ? 100 / totalMatrixSum : 1;
  const scoreCellsFormatted: ScoreProbabilityCell[] = [];

  for (let x = 0; x <= maxGoals; x++) {
    const row: ScoreProbabilityCell[] = [];
    for (let y = 0; y <= maxGoals; y++) {
      const cell = rawCells.find((c) => c.x === x && c.y === y)!;
      const pct = Number((cell.p * normFactor).toFixed(2));
      const cellObj: ScoreProbabilityCell = {
        homeGoals: x,
        awayGoals: y,
        score: `${x}-${y}`,
        prob: pct,
      };
      row.push(cellObj);
      scoreCellsFormatted.push(cellObj);

      if (x > y) sumHomeWin += pct;
      else if (x === y) sumDraw += pct;
      else sumAwayWin += pct;

      const totalGoals = x + y;
      if (totalGoals > 1.5) sumOver15 += pct;
      if (totalGoals > 2.5) sumOver25 += pct;
      if (totalGoals > 3.5) sumOver35 += pct;
      if (x > 0 && y > 0) sumBtts += pct;
    }
    matrix.push(row);
  }

  // Top Most Likely Scores
  const topScores = [...scoreCellsFormatted]
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 6)
    .map((c) => ({ score: c.score, prob: c.prob }));

  // Final probabilities rounded
  const homeProb = Number(sumHomeWin.toFixed(1));
  const drawProb = Number(sumDraw.toFixed(1));
  const awayProb = Number(sumAwayWin.toFixed(1));

  let predictedResult: "home" | "draw" | "away" = "home";
  if (drawProb > homeProb && drawProb > awayProb) predictedResult = "draw";
  else if (awayProb > homeProb && awayProb > drawProb) predictedResult = "away";

  // Confidence assessment
  const maxP = Math.max(homeProb, drawProb, awayProb);
  let confidence: "High" | "Medium" | "Low" = "Low";
  if (maxP >= 55) confidence = "High";
  else if (maxP >= 42) confidence = "Medium";

  // Build 8 Signals Breakdown
  const signals: SeasonPredictionSignal[] = [
    {
      name: "form",
      label: "Recent Form (PPG)",
      homeValue: `${homeFormPpg.toFixed(2)} PPG`,
      awayValue: `${awayFormPpg.toFixed(2)} PPG`,
      favor: homeFormPpg > awayFormPpg + 0.3 ? "home" : awayFormPpg > homeFormPpg + 0.3 ? "away" : "draw",
      weight: 0.18,
      description: `Last 10 matches: ${normHome} earned ${homeFormPts} pts, ${normAway} earned ${awayFormPts} pts.`,
    },
    {
      name: "venue_power",
      label: "Home / Away Win Rate",
      homeValue: `${((homeWins / homeCount) * 100).toFixed(0)}% at home`,
      awayValue: `${((awayWins / awayCount) * 100).toFixed(0)}% away`,
      favor: homeWins / homeCount > (awayWins / awayCount) + 0.15 ? "home" : "away",
      weight: 0.16,
      description: `${normHome} won ${homeWins}/${homeCount} home games. ${normAway} won ${awayWins}/${awayCount} away.`,
    },
    {
      name: "expected_goals",
      label: "Attack vs Defense Rating",
      homeValue: `Exp ${lambdaHome.toFixed(2)}`,
      awayValue: `Exp ${lambdaAway.toFixed(2)}`,
      favor: lambdaHome > lambdaAway + 0.4 ? "home" : lambdaAway > lambdaHome + 0.4 ? "away" : "draw",
      weight: 0.22,
      description: `Bivariate Poisson model yields ${lambdaHome.toFixed(2)} expected home goals vs ${lambdaAway.toFixed(2)} away goals.`,
    },
    {
      name: "shots_efficiency",
      label: "Avg Shots on Target",
      homeValue: `${(homeSot / homeCount).toFixed(1)} SoT`,
      awayValue: `${(awaySot / awayCount).toFixed(1)} SoT`,
      favor: homeSot / homeCount > awaySot / awayCount + 1 ? "home" : awaySot / awayCount > homeSot / homeCount + 1 ? "away" : "draw",
      weight: 0.14,
      description: `Shots on target created per 90 in their respective home/away splits.`,
    },
    {
      name: "set_pieces",
      label: "Corner Generation",
      homeValue: `${(homeCorners / homeCount).toFixed(1)} Corners`,
      awayValue: `${(awayCorners / awayCount).toFixed(1)} Corners`,
      favor: homeCorners / homeCount > awayCorners / awayCount + 1.5 ? "home" : awayCorners / awayCount > homeCorners / homeCount + 1.5 ? "away" : "draw",
      weight: 0.10,
      description: `Corner dominance indicates sustained attacking third pressure.`,
    },
    {
      name: "discipline",
      label: "Yellow Cards per 90",
      homeValue: `${(homeYellows / homeCount).toFixed(1)} YC`,
      awayValue: `${(awayYellows / awayCount).toFixed(1)} YC`,
      favor: "draw",
      weight: 0.06,
      description: `Disciplinary friction and foul rates in previous fixtures.`,
    },
    {
      name: "h2h",
      label: "Head-to-Head Record",
      homeValue: `${h2hHomeWins} Wins`,
      awayValue: `${h2hAwayWins} Wins`,
      favor: h2hHomeWins > h2hAwayWins ? "home" : h2hAwayWins > h2hHomeWins ? "away" : "draw",
      weight: 0.14,
      description: `Historical meetings: ${h2hHomeWins} ${normHome} wins, ${h2hDraws} draws, ${h2hAwayWins} ${normAway} wins.`,
    },
  ];

  // Optional Market Implied comparison
  let marketImplied: SeasonMatchPrediction["marketImplied"] = undefined;
  if (fixtureOdds?.home && fixtureOdds?.draw && fixtureOdds?.away) {
    const invH = 1 / fixtureOdds.home;
    const invD = 1 / fixtureOdds.draw;
    const invA = 1 / fixtureOdds.away;
    const sumInv = invH + invD + invA;
    const mHomeProb = Number(((invH / sumInv) * 100).toFixed(1));
    const mDrawProb = Number(((invD / sumInv) * 100).toFixed(1));
    const mAwayProb = Number(((invA / sumInv) * 100).toFixed(1));

    marketImplied = {
      homeProb: mHomeProb,
      drawProb: mDrawProb,
      awayProb: mAwayProb,
      homeOdds: fixtureOdds.home,
      drawOdds: fixtureOdds.draw,
      awayOdds: fixtureOdds.away,
      homeEdgePct: Number((homeProb - mHomeProb).toFixed(1)),
    };
  }

  return {
    homeTeam: normHome,
    awayTeam: normAway,
    homeProb,
    drawProb,
    awayProb,
    predictedResult,
    confidence,
    expectedHomeGoals: Number(lambdaHome.toFixed(2)),
    expectedAwayGoals: Number(lambdaAway.toFixed(2)),
    totalExpectedGoals: Number((lambdaHome + lambdaAway).toFixed(2)),
    mostLikelyScores: topScores,
    scoreMatrix: matrix,
    over15Prob: Number(sumOver15.toFixed(1)),
    over25Prob: Number(sumOver25.toFixed(1)),
    over35Prob: Number(sumOver35.toFixed(1)),
    bttsProb: Number(sumBtts.toFixed(1)),
    signals,
    marketImplied,
  };
}
