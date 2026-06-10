import { z } from "zod";

import { api } from "@/lib/apiClient";

import {
  type CrearQuinielaForm,
  type UnirseQuinielaForm,
  quinielaResumenSchema,
  quinielaSchema,
} from "../schemas/quiniela.schema";

export const quinielaKeys = {
  all: ["quinielas"] as const,
  detail: (id: number) => ["quiniela", id] as const,
};

export function fetchQuinielas() {
  return api("/api/v1/quinielas", z.array(quinielaResumenSchema));
}

export function fetchQuiniela(id: number) {
  return api(`/api/v1/quinielas/${id}`, quinielaResumenSchema);
}

export function crearQuiniela(datos: CrearQuinielaForm) {
  return api("/api/v1/quinielas", quinielaSchema, { method: "POST", body: datos });
}

export function unirseQuiniela(datos: UnirseQuinielaForm) {
  return api("/api/v1/quinielas/join", quinielaSchema, { method: "POST", body: datos });
}
