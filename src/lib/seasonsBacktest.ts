import type { SeasonMatch, BacktestSummary, BacktestMatchAudit } from "./seasonTypes";
import { predictSeasonMatch } from "./seasonsPredictor";

/**
 * Runs a walk-forward backtest simulating predictions on a test season using
 * training seasons data plus all fixtures played up to the kickoff date.
 */
export function runSeasonBacktest(
  allMatches: SeasonMatch[],
  trainSeasons: string[],
  testSeason: string
): BacktestSummary {
  const trainPool = allMatches.filter((m) => trainSeasons.includes(m.season));
  const testPool = allMatches
    .filter((m) => m.season === testSeason)
    .sort((a, b) => a.date.localeCompare(b.date));

  const audits: BacktestMatchAudit[] = [];
  let correct1X2 = 0;
  let correctScores = 0;
  let correctOver25 = 0;
  let correctBTTS = 0;
  let totalBrier = 0;
  let flatProfitUnits = 0;

  // Walk forward across the test matches
  for (let i = 0; i < testPool.length; i++) {
    const target = testPool[i];
    // In-season history: earlier matches in the same season played before this date
    const inSeasonHistory = testPool.slice(0, i);
    const availableTraining = [...trainPool, ...inSeasonHistory];

    const prediction = predictSeasonMatch(
      availableTraining,
      target.home_team,
      target.away_team,
      {
        home: target.odds.home,
        draw: target.odds.draw,
        away: target.odds.away,
      }
    );

    const actualResult = target.result;
    const isCorrect1X2 = prediction.predictedResult === actualResult;
    const topScore = prediction.mostLikelyScores[0]?.score || "1-1";
    const isCorrectScore = topScore === target.score;

    const actualOver25 = target.total_goals > 2.5;
    const predOver25 = prediction.over25Prob >= 50;
    const isCorrectOver25 = actualOver25 === predOver25;

    const actualBTTS = target.home_goals > 0 && target.away_goals > 0;
    const predBTTS = prediction.bttsProb >= 50;
    const isCorrectBTTS = actualBTTS === predBTTS;

    if (isCorrect1X2) correct1X2++;
    if (isCorrectScore) correctScores++;
    if (isCorrectOver25) correctOver25++;
    if (isCorrectBTTS) correctBTTS++;

    // Brier Score calculation: sum of squared differences between probabilities and binary outcomes
    const oH = actualResult === "home" ? 1 : 0;
    const oD = actualResult === "draw" ? 1 : 0;
    const oA = actualResult === "away" ? 1 : 0;
    const brier =
      Math.pow(prediction.homeProb / 100 - oH, 2) +
      Math.pow(prediction.drawProb / 100 - oD, 2) +
      Math.pow(prediction.awayProb / 100 - oA, 2);
    totalBrier += brier;

    // Simulated 1-unit flat bet on the model's top pick
    const closingOdds = {
      home: target.odds.home_close ?? target.odds.home ?? 1.9,
      draw: target.odds.draw_close ?? target.odds.draw ?? 3.4,
      away: target.odds.away_close ?? target.odds.away ?? 3.8,
    };

    let flatReturn = -1.0;
    if (prediction.predictedResult === "home" && actualResult === "home") {
      flatReturn = closingOdds.home - 1.0;
    } else if (prediction.predictedResult === "draw" && actualResult === "draw") {
      flatReturn = closingOdds.draw - 1.0;
    } else if (prediction.predictedResult === "away" && actualResult === "away") {
      flatReturn = closingOdds.away - 1.0;
    }
    flatProfitUnits += flatReturn;

    audits.push({
      date: target.date,
      homeTeam: target.home_team,
      awayTeam: target.away_team,
      actualScore: target.score,
      actualResult,
      predictedResult: prediction.predictedResult,
      predictedScore: topScore,
      homeProb: prediction.homeProb,
      drawProb: prediction.drawProb,
      awayProb: prediction.awayProb,
      isCorrect1X2,
      isCorrectScore,
      isCorrectOver25,
      isCorrectBTTS,
      marketHomeOdds: closingOdds.home,
      marketDrawOdds: closingOdds.draw,
      marketAwayOdds: closingOdds.away,
      flatReturn: Number(flatReturn.toFixed(2)),
    });
  }

  const n = testPool.length || 1;

  return {
    trainSeasons,
    testSeason,
    totalMatchesTested: testPool.length,
    correct1X2,
    accuracy1X2Pct: Number(((correct1X2 / n) * 100).toFixed(1)),
    correctScores,
    scoreAccuracyPct: Number(((correctScores / n) * 100).toFixed(1)),
    correctOver25,
    accuracyOver25Pct: Number(((correctOver25 / n) * 100).toFixed(1)),
    correctBTTS,
    accuracyBTTSPct: Number(((correctBTTS / n) * 100).toFixed(1)),
    brierScore: Number((totalBrier / n).toFixed(3)),
    simulatedFlatYieldPct: Number(((flatProfitUnits / n) * 100).toFixed(1)),
    audits: audits.reverse(), // most recent matches first
  };
}
