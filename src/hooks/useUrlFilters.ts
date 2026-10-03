import { useState, useEffect, useRef, useCallback } from "react";
import type { MatchFilters, Bookmaker } from "../lib/types";
import { DEFAULT_FILTERS } from "../lib/filters";

export function useUrlFilters() {
  const [filters, setFilters] = useState<MatchFilters>(() => {
    if (typeof window === "undefined") return DEFAULT_FILTERS;

    const params = new URLSearchParams(window.location.search);
    const search = params.get("search") || "";
    const VALID_BOOKMAKERS: Bookmaker[] = ["betika", "mozzart", "sportpesa"];
    const VALID_RESULTS = ["home", "draw", "away", "postponed", "abandoned", "unknown"];
    const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

    const bookmakersParam = params.get("bookmaker") || params.get("bookmakers") || "";
    const bookmakers = bookmakersParam
      ? (bookmakersParam.split(",").filter((b) => VALID_BOOKMAKERS.includes(b as Bookmaker)) as Bookmaker[])
      : [];
    const jackpotsParam = params.get("jackpot") || params.get("jackpots") || "";
    const jackpots = jackpotsParam ? jackpotsParam.split(",").filter(Boolean) : [];
    const resultsParam = params.get("result") || params.get("results") || "";
    const results = resultsParam ? resultsParam.split(",").filter((r) => VALID_RESULTS.includes(r)) : [];
    const fromParam = params.get("from");
    const toParam = params.get("to");
    const from = fromParam && ISO_DATE.test(fromParam) ? fromParam : null;
    const to = toParam && ISO_DATE.test(toParam) ? toParam : null;
    const minOddsStr = params.get("minOdds");
    const minOdds = minOddsStr ? parseFloat(minOddsStr) : null;
    const maxOddsStr = params.get("maxOdds");
    const maxOdds = maxOddsStr ? parseFloat(maxOddsStr) : null;
    const league = params.get("league") || null;

    return {
      search,
      bookmakers,
      jackpots,
      results,
      from,
      to,
      minOdds: isNaN(minOdds as number) ? null : minOdds,
      maxOdds: isNaN(maxOdds as number) ? null : maxOdds,
      league,
    };
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams();

      if (filters.search) params.set("search", filters.search);
      if (filters.bookmakers.length) params.set("bookmaker", filters.bookmakers.join(","));
      if (filters.jackpots.length) params.set("jackpot", filters.jackpots.join(","));
      if (filters.results.length) params.set("result", filters.results.join(","));
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.minOdds !== null) params.set("minOdds", filters.minOdds.toString());
      if (filters.maxOdds !== null) params.set("maxOdds", filters.maxOdds.toString());
      if (filters.league) params.set("league", filters.league);

      const qs = params.toString();
      const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;

      if (window.location.search !== (qs ? `?${qs}` : "")) {
        window.history.replaceState(null, "", newUrl);
      }
    }, 200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return { filters, setFilters, resetFilters };
}
