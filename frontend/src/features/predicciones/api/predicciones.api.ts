import { z } from "zod";

import { api } from "@/lib/apiClient";

import { prediccionSchema } from "../schemas/prediccion.schema";

export const prediccionKeys = {
  mine: (quinielaId: number) => ["predicciones", { quinielaId }] as const,
};

export function fetchMisPredicciones(quinielaId: number) {
  // hasta 104 predicciones (torneo completo): cabe en una página
  return api(
    `/api/v1/quinielas/${quinielaId}/predicciones/me?limit=200`,
    z.array(prediccionSchema),
  );
}

export function guardarPrediccion(
  quinielaId: number,
  datos: { partido_id: number; goles_local: number; goles_visitante: number },
) {
  return api(`/api/v1/quinielas/${quinielaId}/predicciones`, prediccionSchema, {
    method: "PUT",
    body: datos,
  });
}
