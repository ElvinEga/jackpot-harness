// Types matching the Mozzart predefined-tickets API response schema

export interface MozzartCompetition {
  id: number;
  name: string;
  shortName?: string;
  countryCode?: string;
  description?: string;
}

export interface MozzartOdd {
  bettingGameId: number;
  bettingSubGameId: number;
  bettingGameName: string;
  bettingSubGameName: "1" | "X" | "2" | string;
  bettingSubGameOdds: string; // decimal as string e.g. "2.60"
}

export interface MozzartMatch {
  rowNumber: number;
  id: number;
  matchNumber: number;
  competition: MozzartCompetition;
  time: number; // Unix milliseconds
  home: string;
  visitor: string;
  homeResult: number | null;
  visitorResult: number | null;
  shortResultDesc: string | null;
  odds: MozzartOdd[];
}

export interface MozzartPredefinedTicket {
  id: number;
  roundId: number;
  totalRows: number;
  fixRows: number;
  fixedPayInAmount: number;
  fixedPayOutAmount: number | null;
  code: string;
  totalOdd: number | null;
  description: string;
  ticketType: string;
  ticketCreationTime: number;
  matches: MozzartMatch[];
}

// Parsed, normalized shapes used by the UI

export interface ParsedMozzartMatch {
  rowNumber: number;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  country: string;
  kickOffTime: string; // ISO-8601 string
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
}

export interface ParsedMozzartJackpot {
  id: number;
  roundId: number;
  totalRows: number;
  jackpotAmount: number | null;
  matches: ParsedMozzartMatch[];
}

/**
 * Parses raw Mozzart predefined-tickets payload into a normalized fixture list.
 * The API returns an array; this function takes the first element (active jackpot).
 */
export function parseMozzartJackpot(data: MozzartPredefinedTicket[]): ParsedMozzartJackpot {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Invalid Mozzart payload: expected a non-empty array");
  }

  const ticket = data[0];

  if (!Array.isArray(ticket.matches)) {
    throw new Error("Invalid Mozzart payload: missing matches array");
  }

  const sorted = [...ticket.matches].sort((a, b) => a.rowNumber - b.rowNumber);

  const matches: ParsedMozzartMatch[] = sorted.map((m) => {
    const oddsMap: Record<string, number> = {};
    for (const o of m.odds ?? []) {
      const key = o.bettingSubGameName; // "1", "X", or "2"
      const val = parseFloat(o.bettingSubGameOdds);
      if (!isNaN(val)) oddsMap[key] = val;
    }

    return {
      rowNumber: m.rowNumber,
      homeTeam: (m.home ?? "").trim(),
      awayTeam: (m.visitor ?? "").trim(),
      competition: m.competition?.name ?? "",
      country: m.competition?.countryCode?.toUpperCase() ?? "",
      kickOffTime: new Date(m.time).toISOString(),
      homeOdds: oddsMap["1"],
      drawOdds: oddsMap["X"],
      awayOdds: oddsMap["2"],
    };
  });

  return {
    id: ticket.id,
    roundId: ticket.roundId,
    totalRows: ticket.totalRows,
    jackpotAmount: ticket.fixedPayOutAmount ?? null,
    matches,
  };
}

const LIVE_ENDPOINT = "/api/mozzart/super-jackpot";
const SNAPSHOT_ENDPOINT = "/data/mozzart-active.json";

/** First 200 chars, collapsed to one line, for console diagnostics. */
function preview(text: string): string {
  return text.slice(0, 200).replace(/\s+/g, " ").trim();
}

/**
 * Fetches the active Mozzart Super Jackpot from the server-side leg.
 * Falls back to the bundled snapshot if the leg is unavailable (static hosting).
 * Both outcomes are logged.
 */
export async function fetchActiveMozzartJackpot(): Promise<ParsedMozzartJackpot> {
  // 1. Try the server-side leg
  try {
    const res = await fetch(LIVE_ENDPOINT, { headers: { Accept: "application/json" } });
    const text = await res.text();

    if (!res.ok) {
      console.warn(`[mozzart] ${LIVE_ENDPOINT} -> HTTP ${res.status} (${text.length}b): ${preview(text)}`);
    } else {
      try {
        const data = JSON.parse(text) as MozzartPredefinedTicket[];
        if (Array.isArray(data) && data.length > 0) {
          console.info(`[mozzart] live ticket ${data[0]?.id}: ${data[0]?.matches?.length ?? 0} matches`);
          return parseMozzartJackpot(data);
        }
        console.warn(`[mozzart] ${LIVE_ENDPOINT} -> HTTP ${res.status} but empty payload: ${preview(text)}`);
      } catch {
        console.warn(`[mozzart] ${LIVE_ENDPOINT} -> HTTP ${res.status} but body is not JSON: ${preview(text)}`);
      }
    }
  } catch (err: unknown) {
    console.warn(`[mozzart] ${LIVE_ENDPOINT} -> request failed:`, err);
  }

  // 2. Fallback to bundled snapshot
  console.warn(`[mozzart] falling back to bundled snapshot ${SNAPSHOT_ENDPOINT}`);
  try {
    const fallbackRes = await fetch(SNAPSHOT_ENDPOINT);
    if (fallbackRes.ok) {
      const fallbackData: MozzartPredefinedTicket[] = await fallbackRes.json();
      return parseMozzartJackpot(fallbackData);
    }
    console.error(`[mozzart] ${SNAPSHOT_ENDPOINT} -> HTTP ${fallbackRes.status}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[mozzart] ${SNAPSHOT_ENDPOINT} -> failed:`, err);
    throw new Error(`Failed to load Mozzart super jackpot: ${msg}`);
  }

  throw new Error("Unable to retrieve active Mozzart super jackpot from API or local cache.");
}
