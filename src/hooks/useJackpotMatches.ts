import { useQuery } from "@tanstack/react-query";
import { loadAllMatches } from "../lib/data";
import type { Match } from "../lib/types";

export function useJackpotMatches() {
  return useQuery<Match[]>({
    queryKey: ["jackpot-matches"],
    queryFn: async () => {
      return await loadAllMatches();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });
}
