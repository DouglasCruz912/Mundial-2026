import { api } from "@/lib/apiClient";

import { partidoSchema } from "@/features/partidos/schemas/partido.schema";

export function registrarResultado(
  partidoId: number,
  datos: { goles_local: number; goles_visitante: number },
) {
  return api(`/api/v1/partidos/${partidoId}/resultado`, partidoSchema, {
    method: "PUT",
    body: datos,
  });
}
