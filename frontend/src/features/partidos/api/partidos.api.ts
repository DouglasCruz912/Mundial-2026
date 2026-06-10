import { z } from "zod";

import { api } from "@/lib/apiClient";

import { partidoSchema } from "../schemas/partido.schema";

export const partidoKeys = {
  all: ["partidos"] as const,
};

export function fetchPartidos() {
  // 104 partidos: el torneo completo cabe en una página
  return api("/api/v1/partidos?limit=200", z.array(partidoSchema));
}
