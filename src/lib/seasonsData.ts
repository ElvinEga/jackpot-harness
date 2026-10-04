import type { SeasonIndex, SeasonMatch } from "./seasonTypes";

// In-memory caches to avoid redundant HTTP requests
const seasonIndexCache = new Map<string, SeasonIndex>();
const seasonMatchesCache = new Map<string, SeasonMatch[]>();
const allMatchesCache = new Map<string, SeasonMatch[]>();

export const AVAILABLE_COMPETITIONS = [
  {
    id: "premier_league",
    name: "Premier League",
    country: "England",
    countryCode: "ENG",
    division: "E0",
  },
  {
    id: "laliga_primera",
    name: "La Liga",
    country: "Spain",
    countryCode: "ESP",
    division: "SP1",
  },
  {
    id: "bundesliga_1",
    name: "Bundesliga",
    country: "Germany",
    countryCode: "DEU",
    division: "D1",
  },
];

/**
 * Fetches the index metadata for a given competition.
 */
export async function fetchSeasonIndex(
  competition = "premier_league"
): Promise<SeasonIndex> {
  if (seasonIndexCache.has(competition)) {
    return seasonIndexCache.get(competition)!;
  }

  const url = `/data/seasons/${competition}/index.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to load season index for ${competition}: HTTP ${res.status} ${res.statusText}`
    );
  }

  const data: SeasonIndex = await res.json();
  seasonIndexCache.set(competition, data);
  return data;
}

/**
 * Fetches matches for a single season file (e.g. "2024-2025.json").
 */
export async function fetchSeasonMatches(
  competition = "premier_league",
  seasonFile: string
): Promise<SeasonMatch[]> {
  const cacheKey = `${competition}:${seasonFile}`;
  if (seasonMatchesCache.has(cacheKey)) {
    return seasonMatchesCache.get(cacheKey)!;
  }

  const cleanFile = seasonFile.endsWith(".json")
    ? seasonFile
    : `${seasonFile}.json`;
  const url = `/data/seasons/${competition}/${cleanFile}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to load season matches from ${url}: HTTP ${res.status} ${res.statusText}`
    );
  }

  const data: SeasonMatch[] = await res.json();
  seasonMatchesCache.set(cacheKey, data);
  return data;
}

/**
 * Fetches all seasons for a competition concurrently and returns a unified array.
 */
export async function fetchAllSeasonMatches(
  competition = "premier_league",
  onProgress?: (loaded: number, total: number) => void
): Promise<SeasonMatch[]> {
  if (allMatchesCache.has(competition)) {
    return allMatchesCache.get(competition)!;
  }

  const index = await fetchSeasonIndex(competition);
  let loadedCount = 0;
  const total = index.seasons.length;

  const results = await Promise.all(
    index.seasons.map(async (entry) => {
      const matches = await fetchSeasonMatches(competition, entry.file);
      loadedCount++;
      if (onProgress) {
        onProgress(loadedCount, total);
      }
      return matches;
    })
  );

  const flatMatches = results.flat();
  // Sort chronologically by date then home team
  flatMatches.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return a.home_team.localeCompare(b.home_team);
  });

  allMatchesCache.set(competition, flatMatches);
  return flatMatches;
}
