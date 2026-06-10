import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { quinielaKeys } from "@/features/quinielas/api/quinielas.api";

import {
  fetchMisPredicciones,
  guardarPrediccion,
  prediccionKeys,
} from "../api/predicciones.api";

export function useMisPredicciones(quinielaId: number) {
  return useQuery({
    queryKey: prediccionKeys.mine(quinielaId),
    queryFn: () => fetchMisPredicciones(quinielaId),
  });
}

export function useGuardarPrediccion(quinielaId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: { partido_id: number; goles_local: number; goles_visitante: number }) =>
      guardarPrediccion(quinielaId, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prediccionKeys.mine(quinielaId) });
      void queryClient.invalidateQueries({ queryKey: quinielaKeys.all });
    },
  });
}
