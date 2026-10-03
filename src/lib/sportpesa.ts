export interface SportPesaCompetitor {
  competitorName: string;
  isHome: boolean;
}

export interface SportPesaEvent {
  id: string;
  utcKickOffTime: string;
  bettingStatus: string;
  competitors: SportPesaCompetitor[];
  tournamentName: string;
  countryIsoCode?: string;
  countryName?: string;
  home?: number;
  draw?: number;
  away?: number;
  score?: { home: number; away: number } | null;
  publicDraw?: null | unknown;
  order: number;
}

export interface SportPesaActiveJackpotResponse {
  id: string;
  humanId: number;
  settings?: {
    numberOfEvents: number;
    jackpotTypes: string[];
  };
  betCombinationsLimits?: {
    maxOnlyDoubles?: number;
    maxOnlyTriples?: number;
    maxCombining?: number;
    maxCombiningDoubles?: number;
    maxCombiningTriples?: number;
  };
  bettingStatus: string;
  events: SportPesaEvent[];
}

export interface ParsedSportPesaMatch {
  order: number;
  homeTeam: string;
  awayTeam: string;
  tournament: string;
  country: string;
  kickOffTime: string;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  bettingStatus: string;
}

export interface ParsedSportPesaJackpot {
  id: string;
  humanId: number;
  bettingStatus: string;
  numberOfEvents: number;
  matches: ParsedSportPesaMatch[];
}

/**
 * Normalizes a team name from SportPesa API format
 */
export function normalizeSportPesaTeamName(rawName: string): string {
  if (!rawName) return "";
  return rawName.trim();
}

/**
 * Parses raw SportPesa active jackpot payload into standardized fixture list
 */
export function parseSportPesaJackpot(data: SportPesaActiveJackpotResponse): ParsedSportPesaJackpot {
  if (!data || !Array.isArray(data.events)) {
    throw new Error("Invalid SportPesa jackpot payload: missing events array");
  }

  const sortedEvents = [...data.events].sort((a, b) => a.order - b.order);

  const matches: ParsedSportPesaMatch[] = sortedEvents.map((ev) => {
    const homeComp = ev.competitors?.find((c) => c.isHome);
    const awayComp = ev.competitors?.find((c) => !c.isHome);

    const homeTeam = normalizeSportPesaTeamName(homeComp?.competitorName || "");
    const awayTeam = normalizeSportPesaTeamName(awayComp?.competitorName || "");

    return {
      order: ev.order,
      homeTeam,
      awayTeam,
      tournament: ev.tournamentName || "",
      country: ev.countryName || ev.countryIsoCode || "",
      kickOffTime: ev.utcKickOffTime || "",
      homeOdds: typeof ev.home === "number" ? ev.home : undefined,
      drawOdds: typeof ev.draw === "number" ? ev.draw : undefined,
      awayOdds: typeof ev.away === "number" ? ev.away : undefined,
      bettingStatus: ev.bettingStatus || "Unknown",
    };
  });

  return {
    id: data.id,
    humanId: data.humanId,
    bettingStatus: data.bettingStatus || "Open",
    numberOfEvents: data.settings?.numberOfEvents || matches.length,
    matches,
  };
}

/**
 * Fetches the active SportPesa Mega Jackpot Pro.
 * First queries the local Vite proxy (/api/sportpesa/active).
 * If that fails (e.g. running on static production host or network error),
 * falls back to the bundled snapshot (/data/sportpesa-active.json).
 */
export async function fetchActiveSportPesaJackpot(): Promise<ParsedSportPesaJackpot> {
  // 1. Try local dev proxy endpoint
  try {
    const res = await fetch("/api/sportpesa/active", {
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data: SportPesaActiveJackpotResponse = await res.json();
      if (data && Array.isArray(data.events) && data.events.length > 0) {
        return parseSportPesaJackpot(data);
      }
    }
  } catch {
    // Silently proceed to fallback
  }

  // 2. Fallback to bundled active dataset snapshot
  try {
    const fallbackRes = await fetch("/data/sportpesa-active.json");
    if (fallbackRes.ok) {
      const fallbackData: SportPesaActiveJackpotResponse = await fallbackRes.json();
      return parseSportPesaJackpot(fallbackData);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load SportPesa active jackpot: ${msg}`);
  }

  throw new Error("Unable to retrieve active SportPesa jackpot from API or local cache.");
}
