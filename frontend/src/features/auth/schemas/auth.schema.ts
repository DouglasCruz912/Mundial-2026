import { z } from "zod";

// Contrato alineado con backend/app/schemas/usuario.py (snake_case en el wire)
export const usuarioSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  nombre: z.string(),
  rol: z.enum(["user", "admin"]),
  created_at: z.string(),
});
export type Usuario = z.infer<typeof usuarioSchema>;

export const tokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
});
export type Token = z.infer<typeof tokenSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(50),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
});
export type RegisterForm = z.infer<typeof registerSchema>;
