import { z } from "zod";

// Contrato alineado con backend/app/schemas/leaderboard.py
export const leaderboardEntrySchema = z.object({
  posicion: z.number().int(),
  usuario_id: z.number().int(),
  nombre: z.string(),
  puntos_total: z.number().int(),
  aciertos_exactos: z.number().int(),
  predicciones_evaluadas: z.number().int(),
});
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
