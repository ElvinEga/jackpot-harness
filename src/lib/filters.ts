import type { Match, MatchFilters } from "./types";

export const DEFAULT_FILTERS: MatchFilters = {
  search: "",
  bookmakers: [],
  jackpots: [],
  results: [],
  from: null,
  to: null,
  minOdds: null,
  maxOdds: null,
  league: null,
  position: null,
};

export function filterMatches(matches: Match[], filters: MatchFilters): Match[] {
  const searchTerms = filters.search
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const hasSearch = searchTerms.length > 0;
  const hasBookmakers = filters.bookmakers.length > 0;
  const hasJackpots = filters.jackpots.length > 0;
  const hasResults = filters.results.length > 0;
  const hasFrom = !!filters.from;
  const hasTo = !!filters.to;
  const hasMinOdds = filters.minOdds !== null && !isNaN(filters.minOdds);
  const hasMaxOdds = filters.maxOdds !== null && !isNaN(filters.maxOdds);
  const hasLeague = !!filters.league;
  const hasPosition = filters.position !== undefined && filters.position !== null;

  return matches.filter((m) => {
    // 1. Search term check
    if (hasSearch) {
      const matchText = m.searchText || `${m.home_team} ${m.away_team} ${m.league || ""} ${m.bookmaker} ${m.jackpot} ${m.score || ""}`.toLowerCase();
      for (const term of searchTerms) {
        if (!matchText.includes(term)) {
          return false;
        }
      }
    }

    // 2. Bookmaker filter
    if (hasBookmakers && !filters.bookmakers.includes(m.bookmaker)) {
      return false;
    }

    // 3. Jackpot filter
    if (hasJackpots && !filters.jackpots.includes(m.jackpot)) {
      return false;
    }

    // 4. Result filter
    if (hasResults) {
      const r = m.result || "unknown";
      if (!filters.results.includes(r)) {
        return false;
      }
    }

    // 5. Date bounds
    if (hasFrom && (!m.date || m.date < filters.from!)) {
      return false;
    }
    if (hasTo && (!m.date || m.date > filters.to!)) {
      return false;
    }

    // 6. Odds bounds
    if (hasMinOdds && (m.odds === null || m.odds < filters.minOdds!)) {
      return false;
    }
    if (hasMaxOdds && (m.odds === null || m.odds > filters.maxOdds!)) {
      return false;
    }

    // 7. Specific League
    if (hasLeague && m.league !== filters.league) {
      return false;
    }

    // 8. Specific Position (1..17)
    if (hasPosition && m.position !== filters.position) {
      return false;
    }

    return true;
  });
}
