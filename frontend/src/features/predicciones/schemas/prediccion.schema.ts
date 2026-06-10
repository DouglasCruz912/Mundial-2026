import { z } from "zod";

// Contrato alineado con backend/app/schemas/prediccion.py
export const prediccionSchema = z.object({
  id: z.number().int(),
  partido_id: z.number().int(),
  goles_local: z.number().int(),
  goles_visitante: z.number().int(),
  puntos: z.number().int().nullable(),
  updated_at: z.string(),
});
export type Prediccion = z.infer<typeof prediccionSchema>;

// Los inputs numéricos usan register(..., { valueAsNumber: true })
export const prediccionFormSchema = z.object({
  golesLocal: z.number({ message: "0-20" }).int().min(0, "0-20").max(20, "0-20"),
  golesVisitante: z.number({ message: "0-20" }).int().min(0, "0-20").max(20, "0-20"),
});
export type PrediccionForm = z.infer<typeof prediccionFormSchema>;
