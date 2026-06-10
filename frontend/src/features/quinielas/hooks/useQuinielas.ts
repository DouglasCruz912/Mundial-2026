import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  crearQuiniela,
  fetchQuiniela,
  fetchQuinielas,
  quinielaKeys,
  unirseQuiniela,
} from "../api/quinielas.api";

export function useQuinielas() {
  return useQuery({
    queryKey: quinielaKeys.all,
    queryFn: fetchQuinielas,
    staleTime: 60_000,
  });
}

export function useQuiniela(id: number) {
  return useQuery({
    queryKey: quinielaKeys.detail(id),
    queryFn: () => fetchQuiniela(id),
    staleTime: 60_000,
  });
}

export function useCrearQuiniela() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: crearQuiniela,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quinielaKeys.all });
    },
  });
}

export function useUnirseQuiniela() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unirseQuiniela,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quinielaKeys.all });
    },
  });
}
