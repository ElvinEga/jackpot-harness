import { useQuery } from "@tanstack/react-query";
import { fetchSeasonIndex, fetchAllSeasonMatches } from "../lib/seasonsData";
import type { SeasonIndex, SeasonMatch } from "../lib/seasonTypes";

export function useSeasonIndex(competition = "premier_league") {
  return useQuery<SeasonIndex>({
    queryKey: ["season-index", competition],
    queryFn: () => fetchSeasonIndex(competition),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    refetchOnWindowFocus: false,
  });
}

export function useSeasonMatches(competition = "premier_league") {
  return useQuery<SeasonMatch[]>({
    queryKey: ["season-matches", competition],
    queryFn: () => fetchAllSeasonMatches(competition),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}
