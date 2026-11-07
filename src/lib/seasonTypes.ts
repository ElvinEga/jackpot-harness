// TypeScript definitions for Seasons Mode (Football-Data.co.uk dataset)

export interface SeasonMatchStats {
  home_xg: number | null;
  away_xg: number | null;
  home_shots: number | null;
  away_shots: number | null;
  home_shots_on_target: number | null;
  away_shots_on_target: number | null;
  home_hit_woodwork?: number | null;
  away_hit_woodwork?: number | null;
  home_corners: number | null;
  away_corners: number | null;
  home_fouls: number | null;
  away_fouls: number | null;
  home_offsides?: number | null;
  away_offsides?: number | null;
  home_yellow: number | null;
  away_yellow: number | null;
  home_red: number | null;
  away_red: number | null;
}

export interface SeasonMatchOdds {
  home: number | null;
  draw: number | null;
  away: number | null;
  home_max?: number | null;
  draw_max?: number | null;
  away_max?: number | null;
  home_close?: number | null;
  draw_close?: number | null;
  away_close?: number | null;
  over_2_5: number | null;
  under_2_5: number | null;
  over_2_5_max?: number | null;
  under_2_5_max?: number | null;
  over_2_5_close?: number | null;
  under_2_5_close?: number | null;
  handicap?: number | null;
  handicap_home?: number | null;
  handicap_away?: number | null;
  handicap_close?: number | null;
  handicap_home_close?: number | null;
  handicap_away_close?: number | null;
}

export interface SeasonMatch {
  season: string; // e.g. "2021-2022"
  date: string; // ISO "YYYY-MM-DD"
  kickoff_time: string | null; // "HH:MM"
  home_team: string;
  away_team: string;
  division: string; // "E0"
  league: string; // "England – Premier League"
  score: string | null; // "2-0"; null for an undecided fixture
  home_goals: number | null;
  away_goals: number | null;
  total_goals: number | null;
  result: "home" | "draw" | "away" | null;
  half_time_score: string | null;
  half_time_home_goals: number | null;
  half_time_away_goals: number | null;
  half_time_result: "home" | "draw" | "away" | null;
  referee: string | null;
  stats: SeasonMatchStats;
  odds: SeasonMatchOdds;
}

/**
 * A fixture with a full-time result. The season set keeps a handful of rows whose result is
 * still open (Ligue 2: Bastia v Red Star, 2025-12-05), and those carry a null score with them,
 * so anything that reads goals or books a win/draw/loss works on this narrowed shape.
 */
export type DecidedSeasonMatch = SeasonMatch & {
  score: string;
  home_goals: number;
  away_goals: number;
  total_goals: number;
  result: "home" | "draw" | "away";
};

export const isDecidedSeasonMatch = (m: SeasonMatch): m is DecidedSeasonMatch =>
  m.result !== null;

/**
 * A row of data/processed/seasons/fixtures.json — the site's rolling card of
 * unplayed league fixtures. Same shape as a season row by construction, with
 * the parts a match that has not been played cannot have (`score`, goals,
 * `result`, half-time block, `stats`) null or empty and only the market-average
 * prices filled.
 */
export type UpcomingFixture = SeasonMatch;

export interface SeasonIndexEntry {
  season: string;
  file: string;
  matches: number;
  date_min: string;
  date_max: string;
  teams: number;
}

export interface SeasonIndex {
  competition: string;
  source: string;
  seasons: SeasonIndexEntry[];
}

export interface LeagueStandingRow {
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ("W" | "D" | "L")[];
  homePlayed: number;
  homeWon: number;
  homeDrawn: number;
  homeLost: number;
  homeGF: number;
  homeGA: number;
  homePoints: number;
  awayPlayed: number;
  awayWon: number;
  awayDrawn: number;
  awayLost: number;
  awayGF: number;
  awayGA: number;
  awayPoints: number;
}

export interface TeamSeasonProfile {
  team: string;
  season: string;
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  cleanSheets: number;
  cleanSheetPct: number;
  failedToScore: number;
  bttsCount: number;
  bttsPct: number;
  over25Count: number;
  over25Pct: number;
  avgShots: number;
  avgShotsOnTarget: number;
  shotAccuracyPct: number;
  avgCorners: number;
  avgYellows: number;
  avgReds: number;
  homeRecord: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    gf: number;
    ga: number;
    winRate: number;
  };
  awayRecord: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    gf: number;
    ga: number;
    winRate: number;
  };
  recentMatches: DecidedSeasonMatch[];
  attackRating: number; // 0-100 normalized
  defenseRating: number; // 0-100 normalized
  overallRating: number; // 0-100
}

export interface ScoreProbabilityCell {
  homeGoals: number;
  awayGoals: number;
  score: string;
  prob: number; // percentage e.g. 14.5
}

export interface SeasonPredictionSignal {
  name: string;
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  favor: "home" | "draw" | "away";
  weight: number;
  description: string;
}

export interface SeasonMatchPrediction {
  homeTeam: string;
  awayTeam: string;
  homeProb: number; // e.g. 48.5%
  drawProb: number; // e.g. 26.2%
  awayProb: number; // e.g. 25.3%
  predictedResult: "home" | "draw" | "away";
  confidence: "High" | "Medium" | "Low";
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  totalExpectedGoals: number;
  mostLikelyScores: { score: string; prob: number }[];
  scoreMatrix: ScoreProbabilityCell[][]; // 6x6 matrix (0..5 goals)
  over15Prob: number;
  over25Prob: number;
  over35Prob: number;
  bttsProb: number;
  signals: SeasonPredictionSignal[];
  marketImplied?: {
    homeProb: number;
    drawProb: number;
    awayProb: number;
    homeOdds: number;
    drawOdds: number;
    awayOdds: number;
    homeEdgePct: number; // modelProb - marketProb
  };
}

export interface SeasonComparisonRow {
  season: string;
  matches: number;
  totalGoals: number;
  goalsPerMatch: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  over15Pct: number;
  over25Pct: number;
  over35Pct: number;
  bttsPct: number;
  cleanSheetPct: number;
  avgShotsPerMatch: number;
  avgCornersPerMatch: number;
  avgYellowsPerMatch: number;
}

export interface CalendarMonthStat {
  monthNumber: string; // "08", "09", ...
  monthName: string; // "August", ...
  matches: number;
  avgGoals: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  over25Pct: number;
  bttsPct: number;
}

export interface CalendarDayStat {
  dayName: string; // "Saturday", "Sunday", "Monday", etc.
  matches: number;
  avgGoals: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  over25Pct: number;
}

export interface BacktestMatchAudit {
  date: string;
  homeTeam: string;
  awayTeam: string;
  actualScore: string;
  actualResult: "home" | "draw" | "away";
  predictedResult: "home" | "draw" | "away";
  predictedScore: string;
  homeProb: number;
  drawProb: number;
  awayProb: number;
  isCorrect1X2: boolean;
  isCorrectScore: boolean;
  isCorrectOver25: boolean;
  isCorrectBTTS: boolean;
  marketHomeOdds: number | null;
  marketDrawOdds: number | null;
  marketAwayOdds: number | null;
  flatReturn: number; // e.g. +1.85 if won, -1 if lost
}

export interface BacktestSummary {
  trainSeasons: string[];
  testSeason: string;
  totalMatchesTested: number;
  correct1X2: number;
  accuracy1X2Pct: number;
  correctScores: number;
  scoreAccuracyPct: number;
  correctOver25: number;
  accuracyOver25Pct: number;
  correctBTTS: number;
  accuracyBTTSPct: number;
  brierScore: number;
  simulatedFlatYieldPct: number;
  audits: BacktestMatchAudit[];
}

/**
 * One cell of the joint (1st-half, 2nd-half) score grid a combo is priced
 * from: four goal counts, so a full-time and a half-time market are both sums
 * over the same cells and the HT/FT correlation comes for free.
 */
export interface ComboOutcome {
  homeFirst: number;
  awayFirst: number;
  homeSecond: number;
  awaySecond: number;
  homeGoals: number;
  awayGoals: number;
  totalGoals: number;
  result: "home" | "draw" | "away";
  firstHalfResult: "home" | "draw" | "away";
  prob: number; // percentage points; the whole grid sums to 100
}

export type ComboFamily =
  | "btts-result"
  | "result-total"
  | "win-to-nil"
  | "first-half"
  | "both-halves"
  | "ht-ft"
  | "single";

export interface ComboMarket {
  id: string;
  label: string;
  family: ComboFamily;
  /** False for a diagnostic line that stays out of the ranked slip list. */
  slip: boolean;
  predicate: (outcome: ComboOutcome) => boolean;
}

/** A market priced for one fixture: probability and the odds that imply. */
export interface ComboQuote {
  id: string;
  label: string;
  family: ComboFamily;
  prob: number; // percentage points, 1dp
  fairOdds: number; // decimal, 2dp
}

export interface FixtureCombos {
  fixture: UpcomingFixture;
  lambdaHome: number;
  lambdaAway: number;
  firstHalfShare: number;
  outcomes: number; // grid cells evaluated
  combos: ComboQuote[]; // ranked slip list
  references: ComboQuote[]; // the single legs each combo is read against
  expanded: ComboQuote[]; // every market, ranked
  /** Complementary leg sums taken before the quotes are rounded, so the panel's
   *  Σ proof cannot read as 100.1. */
  partition: { oneX2: number; overUnder25: number };
}
