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
  score: string; // "2-0"
  home_goals: number;
  away_goals: number;
  total_goals: number;
  result: "home" | "draw" | "away";
  half_time_score: string | null;
  half_time_home_goals: number | null;
  half_time_away_goals: number | null;
  half_time_result: "home" | "draw" | "away" | null;
  referee: string | null;
  stats: SeasonMatchStats;
  odds: SeasonMatchOdds;
}

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
  recentMatches: SeasonMatch[];
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
