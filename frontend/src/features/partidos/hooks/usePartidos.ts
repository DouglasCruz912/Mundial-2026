import { useQuery } from "@tanstack/react-query";

import { fetchPartidos, partidoKeys } from "../api/partidos.api";

export function usePartidos() {
  return useQuery({
    queryKey: partidoKeys.all,
    queryFn: fetchPartidos,
    staleTime: 5 * 60_000, // el fixture cambia poco
  });
}
