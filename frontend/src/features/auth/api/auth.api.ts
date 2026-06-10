import { api } from "@/lib/apiClient";

import {
  type LoginForm,
  type RegisterForm,
  tokenSchema,
  usuarioSchema,
} from "../schemas/auth.schema";

export function login(datos: LoginForm) {
  return api("/api/v1/token", tokenSchema, {
    method: "POST",
    form: { username: datos.email, password: datos.password },
  });
}

export function register(datos: RegisterForm) {
  return api("/api/v1/auth/register", usuarioSchema, {
    method: "POST",
    body: datos,
  });
}

export function fetchMe() {
  return api("/api/v1/usuarios/me", usuarioSchema);
}
