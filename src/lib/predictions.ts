import type { Match, MatchPrediction, ScoreProbability, PositionStat } from "./types";
import { computeTeamH2H, computeTeamForm } from "./teams";

// Standard Poisson distribution PMF: P(k; λ) = (λ^k * e^-λ) / k!
function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

export function poissonProbability(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

export function calculateScoreProbabilities(
  expectedHomeGoals: number,
  expectedAwayGoals: number,
  maxGoals = 5
): {
  scores: ScoreProbability[];
  homeProb: number;
  drawProb: number;
  awayProb: number;
} {
  const scores: ScoreProbability[] = [];
  let homeSum = 0;
  let drawSum = 0;
  let awaySum = 0;
  let totalSum = 0;

  for (let h = 0; h <= maxGoals; h++) {
    const pHome = poissonProbability(h, expectedHomeGoals);
    for (let a = 0; a <= maxGoals; a++) {
      const pAway = poissonProbability(a, expectedAwayGoals);
      const prob = pHome * pAway;
      totalSum += prob;

      scores.push({
        score: `${h}-${a}`,
        homeGoals: h,
        awayGoals: a,
        probability: prob,
      });

      if (h > a) homeSum += prob;
      else if (h === a) drawSum += prob;
      else awaySum += prob;
    }
  }

  // Normalize probabilities so they sum to 100%
  const normScores = scores
    .map((s) => ({
      ...s,
      probability: Number(((s.probability / totalSum) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.probability - a.probability);

  return {
    scores: normScores,
    homeProb: Number(((homeSum / totalSum) * 100).toFixed(1)),
    drawProb: Number(((drawSum / totalSum) * 100).toFixed(1)),
    awayProb: Number(((awaySum / totalSum) * 100).toFixed(1)),
  };
}

export function predictMatch(
  matches: Match[],
  homeTeam: string,
  awayTeam: string,
  position = 1,
  positionStats?: PositionStat[]
): MatchPrediction {
  const h2h = computeTeamH2H(matches, homeTeam, awayTeam);
  const homeForm = computeTeamForm(matches, homeTeam);
  const awayForm = computeTeamForm(matches, awayTeam);

  const posStat = positionStats?.find((p) => p.position === position);

  // Baselines across the entire dataset
  const baselineHomeGoals = 1.35;
  const baselineAwayGoals = 1.05;

  // Attack & defense adjustments
  const homeAttack = homeForm.matchesCount >= 3 ? Math.max(0.6, Math.min(2.0, homeForm.avgGF / baselineHomeGoals)) : 1.0;
  const homeDefense = homeForm.matchesCount >= 3 ? Math.max(0.6, Math.min(2.0, homeForm.avgGA / baselineAwayGoals)) : 1.0;
  const awayAttack = awayForm.matchesCount >= 3 ? Math.max(0.6, Math.min(2.0, awayForm.avgGF / baselineAwayGoals)) : 1.0;
  const awayDefense = awayForm.matchesCount >= 3 ? Math.max(0.6, Math.min(2.0, awayForm.avgGA / baselineHomeGoals)) : 1.0;

  // Expected goals
  let expectedHomeGoals = Number((baselineHomeGoals * homeAttack * awayDefense).toFixed(2));
  let expectedAwayGoals = Number((baselineAwayGoals * awayAttack * homeDefense).toFixed(2));

  // Fine-tune with position goal tendency if available
  if (posStat && posStat.avgGoals > 0) {
    const posRatio = posStat.avgGoals / (baselineHomeGoals + baselineAwayGoals);
    expectedHomeGoals = Number(Math.max(0.4, Math.min(3.5, expectedHomeGoals * posRatio)).toFixed(2));
    expectedAwayGoals = Number(Math.max(0.3, Math.min(3.2, expectedAwayGoals * posRatio)).toFixed(2));
  }

  // Calculate Poisson score probabilities
  const poisson = calculateScoreProbabilities(expectedHomeGoals, expectedAwayGoals);

  // Multi-signal probability synthesis
  // Signals:
  // 1. Position historical 1X2 (Weight: 20%)
  // 2. Head-to-Head (Weight: 25% if >= 1 match, else 0%)
  // 3. Team Form (Weight: Home 25%, Away 20%)
  // 4. Poisson Score Modeling (Weight: 10% or more)
  const signals: MatchPrediction["signals"] = [];

  let homeScore = 0;
  let drawScore = 0;
  let awayScore = 0;
  let totalWeights = 0;

  // Signal 1: Position History
  if (posStat && posStat.totalMatches >= 10) {
    const w = 0.20;
    homeScore += (posStat.homeWinPct / 100) * w;
    drawScore += (posStat.drawPct / 100) * w;
    awayScore += (posStat.awayWinPct / 100) * w;
    totalWeights += w;

    const highest = Math.max(posStat.homeWinPct, posStat.drawPct, posStat.awayWinPct);
    const posImpact = highest === posStat.homeWinPct ? "home" : highest === posStat.drawPct ? "draw" : "away";
    signals.push({
      label: `Position #${position} Pattern`,
      detail: `Historical: Home ${posStat.homeWinPct}%, Draw ${posStat.drawPct}%, Away ${posStat.awayWinPct}% across ${posStat.totalMatches} jackpots.`,
      impact: posImpact,
    });
  }

  // Signal 2: Head-to-Head
  if (h2h.totalMatches >= 1) {
    const w = 0.30;
    const h2hHomePct = (h2h.teamAWins / h2h.totalMatches);
    const h2hDrawPct = (h2h.draws / h2h.totalMatches);
    const h2hAwayPct = (h2h.teamBWins / h2h.totalMatches);

    homeScore += h2hHomePct * w;
    drawScore += h2hDrawPct * w;
    awayScore += h2hAwayPct * w;
    totalWeights += w;

    const h2hImpact = h2h.teamAWins > h2h.teamBWins ? "home" : h2h.teamBWins > h2h.teamAWins ? "away" : "draw";
    signals.push({
      label: "Head-to-Head Record",
      detail: `${h2h.totalMatches} previous match${h2h.totalMatches > 1 ? "es" : ""}: ${homeTeam} ${h2h.teamAWins}W, ${h2h.draws}D, ${awayTeam} ${h2h.teamBWins}W.`,
      impact: h2hImpact,
    });
  }

  // Signal 3: Home & Away Form
  if (homeForm.matchesCount >= 2 || awayForm.matchesCount >= 2) {
    const wHome = 0.25;
    const wAway = 0.20;

    // Home team advantage & form
    const hWinRate = (homeForm.homeMatchesCount > 0 ? homeForm.homeWinRate : homeForm.winRate) / 100;
    homeScore += hWinRate * wHome;
    drawScore += 0.27 * wHome;
    awayScore += (1 - hWinRate - 0.27) * wHome;
    totalWeights += wHome;

    // Away team form
    const aWinRate = (awayForm.awayMatchesCount > 0 ? awayForm.awayWinRate : awayForm.winRate) / 100;
    awayScore += aWinRate * wAway;
    drawScore += 0.27 * wAway;
    homeScore += (1 - aWinRate - 0.27) * wAway;
    totalWeights += wAway;

    signals.push({
      label: "Recent Form & Goal Threat",
      detail: `${homeTeam}: ${homeForm.recentResults.slice(0, 5).join("-") || "N/A"} (${homeForm.avgGF} GF/G). ${awayTeam}: ${awayForm.recentResults.slice(0, 5).join("-") || "N/A"} (${awayForm.avgGF} GF/G).`,
      impact: homeForm.winRate > awayForm.winRate ? "home" : awayForm.winRate > homeForm.winRate ? "away" : "neutral",
    });
  }

  // Signal 4: Poisson Goal Model
  const wPoisson = 0.25;
  homeScore += (poisson.homeProb / 100) * wPoisson;
  drawScore += (poisson.drawProb / 100) * wPoisson;
  awayScore += (poisson.awayProb / 100) * wPoisson;
  totalWeights += wPoisson;

  signals.push({
    label: "Poisson Score Model",
    detail: `Expected goals: ${homeTeam} ${expectedHomeGoals} – ${expectedAwayGoals} ${awayTeam}. Most likely: ${poisson.scores[0]?.score || "1-1"} (${poisson.scores[0]?.probability}%).`,
    impact: poisson.homeProb > poisson.awayProb ? "home" : "away",
  });

  // Calculate final normalized probabilities
  const finalHomeProb = Number(((homeScore / totalWeights) * 100).toFixed(1));
  const finalDrawProb = Number(((drawScore / totalWeights) * 100).toFixed(1));
  const finalAwayProb = Number(((awayScore / totalWeights) * 100).toFixed(1));

  let predictedResult: "home" | "draw" | "away" = "home";
  if (finalDrawProb > finalHomeProb && finalDrawProb > finalAwayProb) {
    predictedResult = "draw";
  } else if (finalAwayProb > finalHomeProb && finalAwayProb > finalDrawProb) {
    predictedResult = "away";
  }

  // Confidence determination
  const maxProb = Math.max(finalHomeProb, finalDrawProb, finalAwayProb);
  const secondProb = [finalHomeProb, finalDrawProb, finalAwayProb].sort((a, b) => b - a)[1];
  const margin = maxProb - secondProb;

  let confidence: "High" | "Medium" | "Low" = "Low";
  if (margin >= 18 && (h2h.totalMatches >= 2 || homeForm.matchesCount >= 5)) {
    confidence = "High";
  } else if (margin >= 9) {
    confidence = "Medium";
  }

  return {
    position,
    homeTeam,
    awayTeam,
    homeProb: finalHomeProb,
    drawProb: finalDrawProb,
    awayProb: finalAwayProb,
    predictedResult,
    confidence,
    expectedHomeGoals,
    expectedAwayGoals,
    totalExpectedGoals: Number((expectedHomeGoals + expectedAwayGoals).toFixed(2)),
    mostLikelyScores: poisson.scores.slice(0, 5),
    h2hMatchesCount: h2h.totalMatches,
    positionSampleSize: posStat ? posStat.totalMatches : 0,
    signals,
  };
}
