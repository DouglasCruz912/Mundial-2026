import { useMutation, useQueryClient } from "@tanstack/react-query";

import { partidoKeys } from "@/features/partidos/api/partidos.api";

import { registrarResultado } from "../api/admin.api";

export function useRegistrarResultado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      partidoId,
      ...datos
    }: {
      partidoId: number;
      goles_local: number;
      goles_visitante: number;
    }) => registrarResultado(partidoId, datos),
    onSuccess: () => {
      // Un resultado afecta fixture, puntos y rankings de todas las quinielas
      void queryClient.invalidateQueries({ queryKey: partidoKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      void queryClient.invalidateQueries({ queryKey: ["predicciones"] });
      void queryClient.invalidateQueries({ queryKey: ["quinielas"] });
    },
  });
}
