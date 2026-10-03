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

  // SportPesa (1 jackpot)
  {
    bookmaker: "sportpesa",
    jackpot: "Mega Jackpot Pro",
    file: "sportpesa/sportpesa-mega-jackpot-pro.json",
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
];

export const INITIAL_DATASETS = DATASETS.slice(0, 5); // Betika + SportPesa (~10,552 records)
export const SECONDARY_DATASETS = DATASETS.slice(5); // Mozzart (~32,346 records)

async function fetchDataset(ds: DatasetMeta): Promise<Match[]> {
  const response = await fetch(`/data/${ds.file}`);
  if (!response.ok) {
    throw new Error(`Failed to load dataset: ${ds.file} (${response.status} ${response.statusText})`);
  }
  const rawRows: Record<string, unknown>[] = await response.json();

  return rawRows.map((row, idx): Match => {
    const home_team = String(row.home_team || "").trim();
    const away_team = String(row.away_team || "").trim();
    const league = typeof row.league === "string" && row.league.trim() ? row.league.trim() : null;
    const score = typeof row.score === "string" && row.score.trim() ? row.score.trim() : null;
    const date = typeof row.date === "string" ? row.date : null;
    const odds = typeof row.odds === "number" && !isNaN(row.odds) ? row.odds : null;
    const result = (typeof row.result === "string" ? row.result.toLowerCase() : null) as Match["result"];
    const jackpot_id = typeof row.jackpot_id === "number" ? row.jackpot_id : null;
    const searchText = `${home_team} ${away_team} ${league || ""} ${ds.bookmaker} ${ds.jackpot} ${score || ""}`.toLowerCase();

    return {
      id: `${ds.file}:${idx}`,
      date,
      home_team,
      away_team,
      league,
      score,
      odds,
      result,
      bookmaker: ds.bookmaker,
      jackpot: ds.jackpot,
      jackpot_id,
      source_file: ds.file,
      searchText,
    };
  });
}

export async function loadInitialMatches(): Promise<Match[]> {
  const results = await Promise.all(INITIAL_DATASETS.map(fetchDataset));
  return results.flat();
}

export async function loadRemainingMatches(): Promise<Match[]> {
  const results = await Promise.all(SECONDARY_DATASETS.map(fetchDataset));
  return results.flat();
}

export async function loadAllMatches(
  onProgress?: (loaded: number, total: number) => void
): Promise<Match[]> {
  let loadedCount = 0;
  const total = DATASETS.length;

  const datasetResults = await Promise.all(
    DATASETS.map(async (ds) => {
      const matches = await fetchDataset(ds);
      loadedCount++;
      if (onProgress) {
        onProgress(loadedCount, total);
      }
      return matches;
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
