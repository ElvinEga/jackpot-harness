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
  odds: number | null;
  result: Result;
  bookmaker: Bookmaker;
  jackpot: string;
  jackpot_id?: number | null;
  source_file: string;
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
};

export type DatasetMeta = {
  bookmaker: Bookmaker;
  jackpot: string;
  file: string;
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
