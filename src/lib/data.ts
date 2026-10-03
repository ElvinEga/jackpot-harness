import type { DatasetMeta, Match, AppStats } from "./types";

export const DATASETS: DatasetMeta[] = [
  // Betika (4 jackpots)
  {
    bookmaker: "betika",
    jackpot: "Grand Jackpot",
    file: "betika/betika-grand-jackpot.json",
    defaultSize: 17,
  },
  {
    bookmaker: "betika",
    jackpot: "Mega Jackpot",
    file: "betika/betika-mega-jackpot.json",
    defaultSize: 17,
  },
  {
    bookmaker: "betika",
    jackpot: "Midweek Jackpot",
    file: "betika/betika-midweek-jackpot.json",
    defaultSize: 15,
  },
  {
    bookmaker: "betika",
    jackpot: "Must Be Won Jackpot",
    file: "betika/betika-must-be-won-jackpot.json",
    defaultSize: 15,
  },

  // SportPesa (1 jackpot)
  {
    bookmaker: "sportpesa",
    jackpot: "Mega Jackpot Pro",
    file: "sportpesa/sportpesa-mega-jackpot-pro.json",
    defaultSize: 17,
  },

  // Mozzart (2 products — Super Grand Jackpot is separate)
  {
    bookmaker: "mozzart",
    jackpot: "Super Grand Jackpot",
    file: "mozzart/mozzart-super-grand-jackpot.json",
    defaultSize: 20,
  },
  // NOTE: "Super Jackpot" is a SINGLE product spread across 5 extract files
  // (mozzart-super-jackpot.json … mozzart-super-jackpot5.json).
  // This sentinel entry is used only for UI dropdowns and filter matching;
  // actual data loading is done by loadMozzartSuperJackpot() below.
  {
    bookmaker: "mozzart",
    jackpot: "Super Jackpot",
    file: "mozzart/mozzart-super-jackpot.json", // sentinel — not the only file
    defaultSize: 16,
  },
];

// The 5 raw extract files that together form the single Mozzart Super Jackpot product
const MOZZART_SUPER_JACKPOT_FILES = [
  "mozzart/mozzart-super-jackpot.json",
  "mozzart/mozzart-super-jackpot2.json",
  "mozzart/mozzart-super-jackpot3.json",
  "mozzart/mozzart-super-jackpot4.json",
  "mozzart/mozzart-super-jackpot5.json",
];

export const INITIAL_DATASETS = DATASETS.slice(0, 5); // Betika + SportPesa (~10,552 records)
export const SECONDARY_DATASETS = DATASETS.slice(5);  // Mozzart (~32,346 records, Super Jackpot merged)

/**
 * Converts a raw JSON row from a processed data file into a typed Match object.
 * `fileKey` is used to build stable IDs and is the actual file path being read.
 * `ds` carries the logical jackpot name used across UI / filter comparisons.
 */
function rowToMatch(
  row: Record<string, unknown>,
  idx: number,
  fileKey: string,
  ds: DatasetMeta,
  curEventKey: { v: string | null },
  curPos: { v: number },
  eventIdx: { v: number }
): Match {
  const home_team = String(row.home_team || "").trim();
  const away_team = String(row.away_team || "").trim();
  const league = typeof row.league === "string" && row.league.trim() ? row.league.trim() : null;
  const score = typeof row.score === "string" && row.score.trim() ? row.score.trim() : null;
  const date = typeof row.date === "string" ? row.date : null;
  const odds = typeof row.odds === "number" && !isNaN(row.odds) ? row.odds : null;
  const result = (typeof row.result === "string" ? row.result.toLowerCase() : null) as Match["result"];
  const jackpot_id = typeof row.jackpot_id === "number" ? row.jackpot_id : null;

  // Parse numeric goals if score is formatted as "H-A"
  let home_goals: number | null = null;
  let away_goals: number | null = null;
  let total_goals: number | null = null;
  if (score && score.includes("-")) {
    const parts = score.split("-").map((v) => parseInt(v.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      home_goals = parts[0];
      away_goals = parts[1];
      total_goals = parts[0] + parts[1];
    }
  }

  // Determine jackpot event and position (1-indexed 1..N)
  const eventIdentifier = jackpot_id !== null ? `id_${jackpot_id}` : (date || `row_${Math.floor(idx / ds.defaultSize)}`);
  if (eventIdentifier !== curEventKey.v || curPos.v >= ds.defaultSize) {
    curEventKey.v = eventIdentifier;
    curPos.v = 1;
    eventIdx.v++;
  } else {
    curPos.v++;
  }

  const jackpot_event_id = `${ds.bookmaker}-${ds.jackpot.toLowerCase().replace(/\s+/g, "-")}-${eventIdentifier}-${eventIdx.v}`;
  const searchText = `${home_team} ${away_team} ${league || ""} ${ds.bookmaker} ${ds.jackpot} ${score || ""}`.toLowerCase();

  return {
    id: `${fileKey}:${idx}`,
    date,
    home_team,
    away_team,
    league,
    score,
    home_goals,
    away_goals,
    total_goals,
    odds,
    result,
    bookmaker: ds.bookmaker,
    jackpot: ds.jackpot,
    jackpot_id,
    position: curPos.v,
    jackpot_event_id,
    source_file: fileKey,
    searchText,
  };
}

/**
 * Fetches and parses a single dataset file.
 * When called on the Mozzart Super Jackpot sentinel, delegates to
 * loadMozzartSuperJackpot() which merges all 5 extract files.
 */
async function fetchDataset(ds: DatasetMeta): Promise<Match[]> {
  // Sentinel entry: Mozzart Super Jackpot is stored across 5 files
  if (ds.bookmaker === "mozzart" && ds.jackpot === "Super Jackpot") {
    return loadMozzartSuperJackpot(ds);
  }

  const response = await fetch(`/data/${ds.file}`);
  if (!response.ok) {
    throw new Error(`Failed to load dataset: ${ds.file} (${response.status} ${response.statusText})`);
  }
  const rawRows: Record<string, unknown>[] = await response.json();

  const curEventKey = { v: null as string | null };
  const curPos = { v: 0 };
  const eventIdx = { v: 0 };

  return rawRows.map((row, idx) => rowToMatch(row, idx, ds.file, ds, curEventKey, curPos, eventIdx));
}

/**
 * Loads all 5 Mozzart Super Jackpot extract files, assigns them all the canonical
 * jackpot name "Super Jackpot", then deduplicates on (date, home_team, away_team)
 * so overlapping extracts don't inflate the dataset.
 */
async function loadMozzartSuperJackpot(ds: DatasetMeta): Promise<Match[]> {
  // Fetch all 5 extract files concurrently; skip any that fail (404 etc.)
  const fileResults = await Promise.allSettled(
    MOZZART_SUPER_JACKPOT_FILES.map(async (file) => {
      const res = await fetch(`/data/${file}`);
      if (!res.ok) return [] as Record<string, unknown>[];
      return (await res.json()) as Record<string, unknown>[];
    })
  );

  // Concatenate all rows from files that loaded successfully
  const allRawRows: Record<string, unknown>[] = [];
  for (const result of fileResults) {
    if (result.status === "fulfilled") {
      allRawRows.push(...result.value);
    }
  }

  // Deduplicate on (date, home_team, away_team) — keep first occurrence
  const seen = new Set<string>();
  const dedupedRows: Record<string, unknown>[] = [];
  for (const row of allRawRows) {
    const date = typeof row.date === "string" ? row.date : "";
    const home = String(row.home_team || "").trim().toLowerCase();
    const away = String(row.away_team || "").trim().toLowerCase();
    const key = `${date}|${home}|${away}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedupedRows.push(row);
    }
  }

  // Convert deduplicated rows to Match objects with unified jackpot name
  const curEventKey = { v: null as string | null };
  const curPos = { v: 0 };
  const eventIdx = { v: 0 };

  return dedupedRows.map((row, idx) =>
    rowToMatch(row, idx, ds.file, ds, curEventKey, curPos, eventIdx)
  );
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
  // Total logical datasets (Super Jackpot counts as 1, not 5)
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
