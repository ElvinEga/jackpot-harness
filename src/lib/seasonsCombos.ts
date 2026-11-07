import { estimateMatchModel, poissonProb, tauAdjustment } from "./seasonsPredictor";
import { canonicalTeam } from "./teamRegistry";
import { isDecidedSeasonMatch } from "./seasonTypes";
import type {
  ComboMarket,
  ComboOutcome,
  ComboQuote,
  FixtureCombos,
  SeasonMatch,
  UpcomingFixture,
} from "./seasonTypes";

/**
 * Combo markets for one fixture, priced off a joint (1st-half, 2nd-half) score
 * grid.
 *
 * `predictSeasonMatch` models a full-time scoreline, so its output cannot speak
 * about a market that spans both halves — "1st-half BTTS & Home to finally win"
 * needs the two halves of a match to be one random variable, not two prices
 * multiplied together. This module splits the predictor's own expected goals by
 * the competition's empirical first-half share and takes the outer product of
 * the two halves. A full-time score is then `(h1 + h2, a1 + a2)`, so 1X2, BTTS,
 * every total line, both half-time results and each HT→FT swing are all sums
 * over the *same* cells: the correlation between "draw at half-time" and "home
 * win" is a property of the grid, not an assumption about independent legs.
 *
 * What it gives up: the two halves are independent, so a 3-goal first half does
 * not open a second half. That is measurable (see the empirical bar-check) and
 * it mildly under-prices "Goals in both halves".
 */

// 0..5 per side per half. 0..3 would cap a full-time score at 6 goals and cut
// the tail the over lines need, so the cell count is 6^4, not 4^4.
const HALF_GOAL_CAP = 5;

/** Used when a division's own history is too thin to fix the split. */
const FALLBACK_FIRST_HALF_SHARE = 0.43;
const MIN_SHARE_ROWS = 200;

/** The slip list only carries markets worth a bettor's attention. */
const MIN_COMBO_PROB_PCT = 8;
const COMBO_LIST_SIZE = 10;

const resultOf = (home: number, away: number): "home" | "draw" | "away" =>
  home > away ? "home" : home === away ? "draw" : "away";

const isBtts = (home: number, away: number) => home > 0 && away > 0;

/**
 * Share of a competition's goals scored in the first half, as a ratio of sums
 * over its history — the weights the predictor's lambdas get split by.
 *
 * Rows with no half-time block are out of numerator *and* denominator: counting
 * them as 0-0 at half-time would pull the share down by nearly a point.
 */
export function firstHalfShare(allMatches: SeasonMatch[], division?: string): number {
  let firstHalfGoals = 0;
  let fullTimeGoals = 0;
  let rows = 0;

  for (const m of allMatches) {
    if (!isDecidedSeasonMatch(m)) continue;
    if (division && m.division !== division) continue;
    if (m.half_time_home_goals === null || m.half_time_away_goals === null) continue;
    firstHalfGoals += m.half_time_home_goals + m.half_time_away_goals;
    fullTimeGoals += m.total_goals;
    rows++;
  }

  if (rows < MIN_SHARE_ROWS || fullTimeGoals === 0) return FALLBACK_FIRST_HALF_SHARE;
  return firstHalfGoals / fullTimeGoals;
}

/**
 * The joint grid: every (h1, a1, h2, a2) up to the cap, each carrying the
 * full-time and half-time readings of itself, normalised to 100 percentage
 * points like the predictor's score matrix.
 */
export function buildHalfGrid(
  lambdaHome: number,
  lambdaAway: number,
  share: number
): ComboOutcome[] {
  const firstHome = lambdaHome * share;
  const firstAway = lambdaAway * share;
  const secondHome = lambdaHome * (1 - share);
  const secondAway = lambdaAway * (1 - share);

  const outcomes: ComboOutcome[] = [];
  let rawSum = 0;

  for (let h1 = 0; h1 <= HALF_GOAL_CAP; h1++) {
    for (let a1 = 0; a1 <= HALF_GOAL_CAP; a1++) {
      const first = poissonProb(h1, firstHome) * poissonProb(a1, firstAway);
      for (let h2 = 0; h2 <= HALF_GOAL_CAP; h2++) {
        for (let a2 = 0; a2 <= HALF_GOAL_CAP; a2++) {
          const homeGoals = h1 + h2;
          const awayGoals = a1 + a2;
          // The halves are independent; the dependence lives in the full-time
          // score, which is where the correction was fitted.
          const prob =
            Math.max(0, first * poissonProb(h2, secondHome) * poissonProb(a2, secondAway)) *
            tauAdjustment(homeGoals, awayGoals, lambdaHome, lambdaAway) *
            10000;
          rawSum += prob;
          outcomes.push({
            homeFirst: h1,
            awayFirst: a1,
            homeSecond: h2,
            awaySecond: a2,
            homeGoals,
            awayGoals,
            totalGoals: homeGoals + awayGoals,
            result: resultOf(homeGoals, awayGoals),
            firstHalfResult: resultOf(h1, a1),
            prob,
          });
        }
      }
    }
  }

  const normFactor = rawSum > 0 ? 100 / rawSum : 0;
  for (const o of outcomes) o.prob *= normFactor;
  return outcomes;
}

/** Sum of the cells a predicate holds for, in percentage points. */
export const comboProbability = (
  outcomes: ComboOutcome[],
  predicate: (outcome: ComboOutcome) => boolean
): number => outcomes.reduce((sum, o) => (predicate(o) ? sum + o.prob : sum), 0);

/**
 * The slip catalogue: named the way a betting slip names them, so a prediction
 * reads as something a bookmaker offers. `slip: false` rows are diagnostics —
 * they price too few scorelines to be worth listing, and are kept visible
 * because they are the check that the grid partitions.
 */
export const COMBO_MARKETS: ComboMarket[] = [
  {
    id: "btts_home",
    label: "Both teams to score & Home win",
    family: "btts-result",
    slip: true,
    predicate: (o) => isBtts(o.homeGoals, o.awayGoals) && o.result === "home",
  },
  {
    id: "btts_draw",
    label: "Both teams to score & Draw",
    family: "btts-result",
    slip: true,
    predicate: (o) => isBtts(o.homeGoals, o.awayGoals) && o.result === "draw",
  },
  {
    id: "btts_away",
    label: "Both teams to score & Away win",
    family: "btts-result",
    slip: true,
    predicate: (o) => isBtts(o.homeGoals, o.awayGoals) && o.result === "away",
  },
  {
    id: "home_over_25",
    label: "Home win & Over 2.5 goals",
    family: "result-total",
    slip: true,
    predicate: (o) => o.result === "home" && o.totalGoals > 2.5,
  },
  {
    id: "home_under_25",
    label: "Home win & Under 2.5 goals",
    family: "result-total",
    slip: true,
    predicate: (o) => o.result === "home" && o.totalGoals < 2.5,
  },
  {
    id: "away_over_25",
    label: "Away win & Over 2.5 goals",
    family: "result-total",
    slip: true,
    predicate: (o) => o.result === "away" && o.totalGoals > 2.5,
  },
  {
    id: "away_under_25",
    label: "Away win & Under 2.5 goals",
    family: "result-total",
    slip: true,
    predicate: (o) => o.result === "away" && o.totalGoals < 2.5,
  },
  {
    id: "home_to_nil",
    label: "Home win to nil",
    family: "win-to-nil",
    slip: true,
    predicate: (o) => o.result === "home" && o.awayGoals === 0,
  },
  {
    id: "away_to_nil",
    label: "Away win to nil",
    family: "win-to-nil",
    slip: true,
    predicate: (o) => o.result === "away" && o.homeGoals === 0,
  },
  {
    id: "first_half_btts_home",
    label: "1st-half BTTS & Home to finally win",
    family: "first-half",
    slip: true,
    predicate: (o) => isBtts(o.homeFirst, o.awayFirst) && o.result === "home",
  },
  {
    id: "first_half_btts_away",
    label: "1st-half BTTS & Away to finally win",
    family: "first-half",
    slip: true,
    predicate: (o) => isBtts(o.homeFirst, o.awayFirst) && o.result === "away",
  },
  {
    id: "goals_both_halves",
    label: "Goals in both halves",
    family: "both-halves",
    slip: true,
    predicate: (o) =>
      o.homeFirst + o.awayFirst > 0 && o.homeSecond + o.awaySecond > 0,
  },
  {
    id: "htft_home_home",
    label: "HT/FT Home–Home",
    family: "ht-ft",
    slip: true,
    predicate: (o) => o.firstHalfResult === "home" && o.result === "home",
  },
  {
    id: "htft_away_away",
    label: "HT/FT Away–Away",
    family: "ht-ft",
    slip: true,
    predicate: (o) => o.firstHalfResult === "away" && o.result === "away",
  },
  {
    id: "htft_draw_home",
    label: "HT Draw / Home win",
    family: "ht-ft",
    slip: true,
    predicate: (o) => o.firstHalfResult === "draw" && o.result === "home",
  },
  {
    id: "htft_draw_away",
    label: "HT Draw / Away win",
    family: "ht-ft",
    slip: true,
    predicate: (o) => o.firstHalfResult === "draw" && o.result === "away",
  },
  {
    // Only the 1-0 cell satisfies it, so it is a grid read-out, not a slip.
    id: "home_under_15",
    label: "Home win & Under 1.5 goals",
    family: "result-total",
    slip: false,
    predicate: (o) => o.result === "home" && o.totalGoals < 1.5,
  },
];

/**
 * The single legs each combo is read against. They are the denominators: a
 * combo above its own leg, or an over line out of order, is a grid bug.
 */
export const REFERENCE_MARKETS: ComboMarket[] = [
  {
    id: "home_win",
    label: "Home win",
    family: "single",
    slip: true,
    predicate: (o) => o.result === "home",
  },
  {
    id: "draw",
    label: "Draw",
    family: "single",
    slip: true,
    predicate: (o) => o.result === "draw",
  },
  {
    id: "away_win",
    label: "Away win",
    family: "single",
    slip: true,
    predicate: (o) => o.result === "away",
  },
  {
    id: "btts",
    label: "Both teams to score",
    family: "single",
    slip: true,
    predicate: (o) => isBtts(o.homeGoals, o.awayGoals),
  },
  {
    id: "over_15",
    label: "Over 1.5 goals",
    family: "single",
    slip: true,
    predicate: (o) => o.totalGoals > 1.5,
  },
  {
    id: "over_25",
    label: "Over 2.5 goals",
    family: "single",
    slip: true,
    predicate: (o) => o.totalGoals > 2.5,
  },
  {
    id: "under_25",
    label: "Under 2.5 goals",
    family: "single",
    slip: true,
    predicate: (o) => o.totalGoals < 2.5,
  },
  {
    id: "over_35",
    label: "Over 3.5 goals",
    family: "single",
    slip: true,
    predicate: (o) => o.totalGoals > 3.5,
  },
  {
    id: "first_half_btts",
    label: "1st-half BTTS",
    family: "single",
    slip: true,
    predicate: (o) => isBtts(o.homeFirst, o.awayFirst),
  },
];

const price = (outcomes: ComboOutcome[], markets: ComboMarket[]): ComboQuote[] =>
  markets
    .map((market) => {
      // Round before inverting so the printed odds are exactly 100 / the
      // printed percentage.
      const prob = Number(comboProbability(outcomes, market.predicate).toFixed(1));
      return {
        id: market.id,
        label: market.label,
        family: market.family,
        prob,
        fairOdds: Number((100 / prob).toFixed(2)),
      };
    })
    .filter((quote) => quote.prob > 0)
    .sort((a, b) => b.prob - a.prob);

const SLIP_MARKETS = COMBO_MARKETS.filter((market) => market.slip);
const DIAGNOSTIC_MARKETS = COMBO_MARKETS.filter((market) => !market.slip);

/**
 * A stable key for one row of the card: the same tie picked from a different
 * panel resolves to the same fixture, whatever spelling the source used.
 */
export const fixtureKey = (fixture: UpcomingFixture): string =>
  `${fixture.date} ${canonicalTeam(fixture.home_team)} v ${canonicalTeam(fixture.away_team)}`;

/**
 * Rank the slip list for one upcoming fixture: the predictor's expected goals,
 * split by the competition's first-half share, then every market the grid can
 * settle. Probabilities below 8% are not worth a line on a card.
 */
export function predictFixtureCombos(
  allMatches: SeasonMatch[],
  fixture: UpcomingFixture
): FixtureCombos {
  // Only history that predates the fixture. A genuine upcoming card makes this a
  // no-op; it is the as-of guarantee that keeps a backtest or a stale row honest.
  const history = allMatches.filter((m) => m.date < fixture.date);
  const share = firstHalfShare(history, fixture.division);
  const { lambdaHome, lambdaAway } = estimateMatchModel(
    history,
    fixture.home_team,
    fixture.away_team,
    { home: fixture.odds.home, draw: fixture.odds.draw, away: fixture.odds.away }
  );

  const outcomes = buildHalfGrid(lambdaHome, lambdaAway, share);
  const slip = price(outcomes, SLIP_MARKETS);
  const diagnostics = price(outcomes, DIAGNOSTIC_MARKETS);
  const references = price(outcomes, REFERENCE_MARKETS);

  return {
    fixture,
    lambdaHome: Number(lambdaHome.toFixed(2)),
    lambdaAway: Number(lambdaAway.toFixed(2)),
    firstHalfShare: Number(share.toFixed(3)),
    outcomes: outcomes.length,
    combos: slip.filter((quote) => quote.prob >= MIN_COMBO_PROB_PCT).slice(0, COMBO_LIST_SIZE),
    references,
    expanded: [...slip, ...diagnostics, ...references].sort((a, b) => b.prob - a.prob),
    partition: {
      oneX2: Number(comboProbability(outcomes, () => true).toFixed(1)),
      overUnder25: Number(
        (
          comboProbability(outcomes, (o) => o.totalGoals > 2.5) +
          comboProbability(outcomes, (o) => o.totalGoals < 2.5)
        ).toFixed(1)
      ),
    },
  };
}
