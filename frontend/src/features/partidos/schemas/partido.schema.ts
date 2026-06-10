import { z } from "zod";

// Contrato alineado con backend/app/schemas/partido.py
export const partidoSchema = z.object({
  id: z.number().int(),
  numero: z.number().int(),
  equipo_local: z.string(),
  equipo_visitante: z.string(),
  fecha_hora: z.string(),
  fase: z.string(),
  grupo: z.string().nullable(),
  goles_local: z.number().int().nullable(),
  goles_visitante: z.number().int().nullable(),
});
export type Partido = z.infer<typeof partidoSchema>;

export function partidoComenzo(partido: Partido): boolean {
  return new Date(partido.fecha_hora).getTime() <= Date.now();
}

export function formatearFecha(fechaIso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(fechaIso));
}
