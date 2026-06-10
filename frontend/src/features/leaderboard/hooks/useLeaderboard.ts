import { useQuery } from "@tanstack/react-query";

import { fetchLeaderboard, leaderboardKeys } from "../api/leaderboard.api";

export function useLeaderboard(quinielaId: number) {
  return useQuery({
    queryKey: leaderboardKeys.byQuiniela(quinielaId),
    queryFn: () => fetchLeaderboard(quinielaId),
    staleTime: 30_000, // ranking fresco
  });
}
