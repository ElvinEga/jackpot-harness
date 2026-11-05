import type { Match, TeamH2H, TeamForm } from "./types";
import { canonicalTeam } from "./teamRegistry";

// club-canonical key -> display spelling -> occurrences
function teamVariants(matches: Match[]): Map<string, Map<string, number>> {
  const groups = new Map<string, Map<string, number>>();
  for (const m of matches) {
    for (const raw of [m.home_team, m.away_team]) {
      if (!raw) continue;
      const key = canonicalTeam(raw);
      if (!key) continue;
      let variants = groups.get(key);
      if (!variants) {
        variants = new Map();
        groups.set(key, variants);
      }
      variants.set(raw, (variants.get(raw) || 0) + 1);
    }
  }
  return groups;
}

// Pick the cleanest spelling: never a betika ticket prefix ("#1 – Arsenal")
// if a plain form exists, then the spelling most sources agree on, ties go to
// the shorter name, then alphabetical, so representatives stay stable.
const TICKET_PREFIX = /^#\d+\s*[–—-]\s*/;

function representative(variants: Map<string, number>): string {
  const chosen =
    [...variants.entries()].sort(
      (a, b) =>
        Number(TICKET_PREFIX.test(a[0])) - Number(TICKET_PREFIX.test(b[0])) ||
        b[1] - a[1] ||
        a[0].length - b[0].length ||
        a[0].localeCompare(b[0])
    )[0][0];
  return chosen.replace(TICKET_PREFIX, "").trim();
}

export function getAllTeams(matches: Match[]): string[] {
  return [...teamVariants(matches).values()].map(representative).sort();
}

export function getTeamAppearances(matches: Match[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const variants of teamVariants(matches).values()) {
    const display = representative(variants);
    counts.set(display, [...variants.values()].reduce((a, b) => a + b, 0));
  }
  return counts;
}

export function computeTeamH2H(
  matches: Match[],
  teamA: string,
  teamB: string
): TeamH2H {
  const normA = canonicalTeam(teamA);
  const normB = canonicalTeam(teamB);

  const encounters: Match[] = [];
  let aWins = 0;
  let bWins = 0;
  let draws = 0;
  let totalGoals = 0;
  let scoredMatches = 0;

  for (const m of matches) {
    const h = m.home_team ? canonicalTeam(m.home_team) : "";
    const a = m.away_team ? canonicalTeam(m.away_team) : "";

    const isMatch = (h === normA && a === normB) || (h === normB && a === normA);
    if (!isMatch) continue;

    encounters.push(m);

    if (m.result === "draw") {
      draws++;
    } else if (h === normA && m.result === "home") {
      aWins++;
    } else if (a === normA && m.result === "away") {
      aWins++;
    } else if (h === normB && m.result === "home") {
      bWins++;
    } else if (a === normB && m.result === "away") {
      bWins++;
    }

    if (m.total_goals !== null) {
      totalGoals += m.total_goals;
      scoredMatches++;
    }
  }

  // Sort encounters by date descending
  encounters.sort((x, y) => {
    if (!x.date) return 1;
    if (!y.date) return -1;
    return y.date.localeCompare(x.date);
  });

  return {
    teamA,
    teamB,
    totalMatches: encounters.length,
    teamAWins: aWins,
    draws,
    teamBWins: bWins,
    avgGoals: scoredMatches > 0 ? Number((totalGoals / scoredMatches).toFixed(2)) : 0,
    recentEncounters: encounters,
  };
}

export function computeTeamForm(
  matches: Match[],
  teamName: string,
  limit = 20
): TeamForm {
  const norm = canonicalTeam(teamName);
  const teamMatches: { match: Match; isHome: boolean }[] = [];

  for (const m of matches) {
    if (!m.home_team || !m.away_team) continue;
    const isHome = canonicalTeam(m.home_team) === norm;
    const isAway = canonicalTeam(m.away_team) === norm;
    if (isHome || isAway) {
      teamMatches.push({ match: m, isHome });
    }
  }

  // Sort by date descending
  teamMatches.sort((a, b) => {
    if (!a.match.date) return 1;
    if (!b.match.date) return -1;
    return b.match.date.localeCompare(a.match.date);
  });

  const recent = teamMatches.slice(0, limit);

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let gf = 0;
  let ga = 0;
  let homeCount = 0;
  let homeWins = 0;
  let awayCount = 0;
  let awayWins = 0;
  const recentResults: ("W" | "D" | "L")[] = [];

  for (const { match, isHome } of recent) {
    if (isHome) {
      homeCount++;
      if (match.result === "home") {
        wins++;
        homeWins++;
        recentResults.push("W");
      } else if (match.result === "draw") {
        draws++;
        recentResults.push("D");
      } else if (match.result === "away") {
        losses++;
        recentResults.push("L");
      }

      if (match.home_goals !== null && match.away_goals !== null) {
        gf += match.home_goals;
        ga += match.away_goals;
      }
    } else {
      awayCount++;
      if (match.result === "away") {
        wins++;
        awayWins++;
        recentResults.push("W");
      } else if (match.result === "draw") {
        draws++;
        recentResults.push("D");
      } else if (match.result === "home") {
        losses++;
        recentResults.push("L");
      }

      if (match.home_goals !== null && match.away_goals !== null) {
        gf += match.away_goals;
        ga += match.home_goals;
      }
    }
  }

  const total = recent.length || 1;

  return {
    team: teamName,
    matchesCount: recent.length,
    wins,
    draws,
    losses,
    winRate: Number(((wins / total) * 100).toFixed(1)),
    goalsFor: gf,
    goalsAgainst: ga,
    avgGF: Number((gf / total).toFixed(2)),
    avgGA: Number((ga / total).toFixed(2)),
    recentResults,
    homeMatchesCount: homeCount,
    homeWinRate: homeCount > 0 ? Number(((homeWins / homeCount) * 100).toFixed(1)) : 0,
    awayMatchesCount: awayCount,
    awayWinRate: awayCount > 0 ? Number(((awayWins / awayCount) * 100).toFixed(1)) : 0,
  };
}
