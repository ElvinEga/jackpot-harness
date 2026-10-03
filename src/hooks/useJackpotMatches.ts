import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { loadInitialMatches, loadRemainingMatches } from "../lib/data";
import type { Match } from "../lib/types";

export function useJackpotMatches() {
  const queryClient = useQueryClient();
  const secondaryLoadedRef = useRef(false);

  const query = useQuery<Match[]>({
    queryKey: ["jackpot-matches"],
    queryFn: async () => {
      return await loadInitialMatches();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data && query.data.length > 0 && !secondaryLoadedRef.current) {
      secondaryLoadedRef.current = true;
      loadRemainingMatches()
        .then((remaining) => {
          queryClient.setQueryData<Match[]>(["jackpot-matches"], (current) => {
            if (!current) return remaining;
            return [...current, ...remaining];
          });
        })
        .catch((err) => {
          console.error("Failed to load secondary jackpot datasets:", err);
          secondaryLoadedRef.current = false;
        });
    }
  }, [query.data, queryClient]);

  return query;
}
