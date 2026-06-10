import { z } from "zod";

import { api } from "@/lib/apiClient";

import { partidoSchema } from "../schemas/partido.schema";

export const partidoKeys = {
  all: ["partidos"] as const,
};

export function fetchPartidos() {
  return api("/api/v1/partidos?limit=100", z.array(partidoSchema));
}
