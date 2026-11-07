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

const LIVE_ENDPOINT = "/api/sportpesa/active";
const SNAPSHOT_ENDPOINT = "/data/sportpesa-active.json";

/** First 200 chars, collapsed to one line, for console diagnostics. */
function preview(text: string): string {
  return text.slice(0, 200).replace(/\s+/g, " ").trim();
}

/**
 * Fetches the active SportPesa Mega Jackpot Pro.
 * First queries the live leg (/api/sportpesa/active — the Vite proxy in dev, a Netlify
 * function in production). If that fails for any reason, falls back to the bundled
 * snapshot (/data/sportpesa-active.json). Both outcomes are logged.
 */
export async function fetchActiveSportPesaJackpot(): Promise<ParsedSportPesaJackpot> {
  // 1. Try the server-side leg
  try {
    const res = await fetch(LIVE_ENDPOINT, {
      headers: {
        Accept: "application/json",
      },
    });
    const text = await res.text();

    if (!res.ok) {
      console.warn(`[sportpesa] ${LIVE_ENDPOINT} -> HTTP ${res.status} (${text.length}b): ${preview(text)}`);
    } else {
      try {
        const data = JSON.parse(text) as SportPesaActiveJackpotResponse;
        if (Array.isArray(data?.events) && data.events.length > 0) {
          console.info(`[sportpesa] live jackpot ${data.humanId}: ${data.events.length} events`);
          return parseSportPesaJackpot(data);
        }
        console.warn(`[sportpesa] ${LIVE_ENDPOINT} -> HTTP ${res.status} but no events: ${preview(text)}`);
      } catch {
        console.warn(`[sportpesa] ${LIVE_ENDPOINT} -> HTTP ${res.status} but body is not JSON: ${preview(text)}`);
      }
    }
  } catch (err: unknown) {
    console.warn(`[sportpesa] ${LIVE_ENDPOINT} -> request failed:`, err);
  }

  // 2. Fallback to bundled active dataset snapshot
  console.warn(`[sportpesa] falling back to bundled snapshot ${SNAPSHOT_ENDPOINT}`);
  try {
    const fallbackRes = await fetch(SNAPSHOT_ENDPOINT);
    if (fallbackRes.ok) {
      const fallbackData: SportPesaActiveJackpotResponse = await fallbackRes.json();
      return parseSportPesaJackpot(fallbackData);
    }
    console.error(`[sportpesa] ${SNAPSHOT_ENDPOINT} -> HTTP ${fallbackRes.status}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[sportpesa] ${SNAPSHOT_ENDPOINT} -> failed:`, err);
    throw new Error(`Failed to load SportPesa active jackpot: ${msg}`);
  }

  throw new Error("Unable to retrieve active SportPesa jackpot from API or local cache.");
}
