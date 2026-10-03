import type { DatasetMeta, Match, AppStats } from "./types";

export const DATASETS: DatasetMeta[] = [
  // Betika (4 jackpots)
  {
    bookmaker: "betika",
    jackpot: "Grand Jackpot",
    file: "betika/betika-grand-jackpot.json",
  },
  {
    bookmaker: "betika",
    jackpot: "Mega Jackpot",
    file: "betika/betika-mega-jackpot.json",
  },
  {
    bookmaker: "betika",
    jackpot: "Midweek Jackpot",
    file: "betika/betika-midweek-jackpot.json",
  },
  {
    bookmaker: "betika",
    jackpot: "Must Be Won Jackpot",
    file: "betika/betika-must-be-won-jackpot.json",
  },

  // Mozzart (6 jackpots / extract batches)
  {
    bookmaker: "mozzart",
    jackpot: "Super Grand Jackpot",
    file: "mozzart/mozzart-super-grand-jackpot.json",
  },
  {
    bookmaker: "mozzart",
    jackpot: "Super Jackpot",
    file: "mozzart/mozzart-super-jackpot.json",
  },
  {
    bookmaker: "mozzart",
    jackpot: "Super Jackpot 2",
    file: "mozzart/mozzart-super-jackpot2.json",
  },
  {
    bookmaker: "mozzart",
    jackpot: "Super Jackpot 3",
    file: "mozzart/mozzart-super-jackpot3.json",
  },
  {
    bookmaker: "mozzart",
    jackpot: "Super Jackpot 4",
    file: "mozzart/mozzart-super-jackpot4.json",
  },
  {
    bookmaker: "mozzart",
    jackpot: "Super Jackpot 5",
    file: "mozzart/mozzart-super-jackpot5.json",
  },

  // SportPesa (1 jackpot)
  {
    bookmaker: "sportpesa",
    jackpot: "Mega Jackpot Pro",
    file: "sportpesa/sportpesa-mega-jackpot-pro.json",
  },
];

export async function loadAllMatches(
  onProgress?: (loaded: number, total: number) => void
): Promise<Match[]> {
  let loadedCount = 0;
  const total = DATASETS.length;

  const datasetResults = await Promise.all(
    DATASETS.map(async (ds) => {
      const response = await fetch(`/data/${ds.file}`);
      if (!response.ok) {
        throw new Error(`Failed to load dataset: ${ds.file} (${response.status} ${response.statusText})`);
      }
      const rawRows: Record<string, unknown>[] = await response.json();
      loadedCount++;
      if (onProgress) {
        onProgress(loadedCount, total);
      }

      return rawRows.map((row, idx): Match => ({
        id: `${ds.file}:${idx}`,
        date: typeof row.date === "string" ? row.date : null,
        home_team: String(row.home_team || "").trim(),
        away_team: String(row.away_team || "").trim(),
        league: typeof row.league === "string" && row.league.trim() ? row.league.trim() : null,
        score: typeof row.score === "string" && row.score.trim() ? row.score.trim() : null,
        odds: typeof row.odds === "number" && !isNaN(row.odds) ? row.odds : null,
        result: (typeof row.result === "string" ? row.result.toLowerCase() : null) as Match["result"],
        bookmaker: ds.bookmaker,
        jackpot: ds.jackpot,
        jackpot_id: typeof row.jackpot_id === "number" ? row.jackpot_id : null,
        source_file: ds.file,
      }));
    })
  );

  return datasetResults.flat();
}

export function computeDatasetStats(matches: Match[]): AppStats {
  const leagues = new Set<string>();
  const teams = new Set<string>();
  let dateMin: string | null = null;
  let dateMax: string | null = null;

  for (const m of matches) {
    if (m.league) leagues.add(m.league);
    if (m.home_team) teams.add(m.home_team);
    if (m.away_team) teams.add(m.away_team);
    if (m.date) {
      if (!dateMin || m.date < dateMin) dateMin = m.date;
      if (!dateMax || m.date > dateMax) dateMax = m.date;
    }
  }

  return {
    totalRecords: matches.length,
    bookmakerCount: 3,
    jackpotCount: DATASETS.length,
    dateMin,
    dateMax,
    leagueCount: leagues.size,
    teamCount: teams.size,
  };
}
