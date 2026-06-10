import { z } from "zod";

import { api } from "@/lib/apiClient";

import { leaderboardEntrySchema } from "../schemas/leaderboard.schema";

export const leaderboardKeys = {
  byQuiniela: (quinielaId: number) => ["leaderboard", quinielaId] as const,
};

export function fetchLeaderboard(quinielaId: number) {
  return api(`/api/v1/quinielas/${quinielaId}/leaderboard`, z.array(leaderboardEntrySchema));
}
