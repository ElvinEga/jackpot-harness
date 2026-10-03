export type Result =
  | "home"
  | "draw"
  | "away"
  | "postponed"
  | "abandoned"
  | "unknown"
  | null;

export type Bookmaker = "betika" | "mozzart" | "sportpesa";

export type Match = {
  id: string; // e.g. "betika/betika-grand-jackpot.json:0"
  date: string | null; // ISO YYYY-MM-DD
  home_team: string;
  away_team: string;
  league: string | null;
  score: string | null; // "H-A" or "Postp" / "Abn"
  home_goals: number | null;
  away_goals: number | null;
  total_goals: number | null;
  odds: number | null;
  result: Result;
  bookmaker: Bookmaker;
  jackpot: string;
  jackpot_id?: number | null;
  position: number; // 1-indexed match position in jackpot (e.g. 1..17)
  jackpot_event_id: string; // Unique id for the jackpot slip/event
  source_file: string;
  searchText?: string;
};

export type MatchFilters = {
  search: string;
  bookmakers: Bookmaker[];
  jackpots: string[];
  results: string[];
  from: string | null;
  to: string | null;
  minOdds: number | null;
  maxOdds: number | null;
  league: string | null;
  position?: number | null;
};

export type DatasetMeta = {
  bookmaker: Bookmaker;
  jackpot: string;
  file: string;
  defaultSize: number;
};

export type AppStats = {
  totalRecords: number;
  bookmakerCount: number;
  jackpotCount: number;
  dateMin: string | null;
  dateMax: string | null;
  leagueCount: number;
  teamCount: number;
};

export type PositionStat = {
  position: number;
  totalMatches: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  avgGoals: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  over15Pct: number;
  over25Pct: number;
  bttsPct: number;
  mostLikelyScore: string;
  topScores: { score: string; count: number; pct: number }[];
};

export type ScoreProbability = {
  score: string;
  homeGoals: number;
  awayGoals: number;
  probability: number;
};

export type MatchPrediction = {
  position: number;
  homeTeam: string;
  awayTeam: string;
  homeProb: number;
  drawProb: number;
  awayProb: number;
  predictedResult: "home" | "draw" | "away";
  confidence: "High" | "Medium" | "Low";
  expectedHomeGoals: number;
  expectedAwayGoals: number;
  totalExpectedGoals: number;
  mostLikelyScores: ScoreProbability[];
  h2hMatchesCount: number;
  positionSampleSize: number;
  signals: {
    label: string;
    detail: string;
    impact: "home" | "draw" | "away" | "neutral";
  }[];
  bookmakerOdds?: { home?: number; draw?: number; away?: number };
  tournament?: string;
  country?: string;
  kickOffTime?: string;
};

export type TeamH2H = {
  teamA: string;
  teamB: string;
  totalMatches: number;
  teamAWins: number;
  draws: number;
  teamBWins: number;
  avgGoals: number;
  recentEncounters: Match[];
};

export type TeamForm = {
  team: string;
  matchesCount: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  goalsFor: number;
  goalsAgainst: number;
  avgGF: number;
  avgGA: number;
  recentResults: ("W" | "D" | "L")[];
  homeMatchesCount: number;
  homeWinRate: number;
  awayMatchesCount: number;
  awayWinRate: number;
};

export type MonthGoalStat = {
  month: number; // 1..12
  monthName: string;
  matches: number;
  totalGoals: number;
  avgGoals: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  over15Pct: number;
  over25Pct: number;
  bttsPct: number;
};

export type DayGoalStat = {
  dayOfWeek: number; // 0..6 (0=Sun)
  dayName: string;
  matches: number;
  avgGoals: number;
  over25Pct: number;
  bttsPct: number;
};
