import { z } from "zod";

// Contrato alineado con backend/app/schemas/quiniela.py
export const quinielaSchema = z.object({
  id: z.number().int(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  codigo_invitacion: z.string(),
  creador_id: z.number().int(),
  created_at: z.string(),
});
export type Quiniela = z.infer<typeof quinielaSchema>;

export const quinielaResumenSchema = quinielaSchema.extend({
  participantes: z.number().int(),
  mis_puntos: z.number().int(),
});
export type QuinielaResumen = z.infer<typeof quinielaResumenSchema>;

export const crearQuinielaSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(80),
  descripcion: z.string().max(255).optional(),
});
export type CrearQuinielaForm = z.infer<typeof crearQuinielaSchema>;

export const unirseQuinielaSchema = z.object({
  codigo: z
    .string()
    .transform((v) => v.trim().toUpperCase())
    .pipe(z.string().regex(/^MUND-[A-Z0-9]{4}$/, "Formato: MUND-XXXX")),
});
export type UnirseQuinielaForm = z.infer<typeof unirseQuinielaSchema>;
