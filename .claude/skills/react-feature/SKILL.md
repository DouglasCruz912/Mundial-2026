---
name: react-feature
description: Scaffold or review a complete React frontend feature (typed component + TanStack Query hooks + Zod/React Hook Form + Zustand) following the project's frontend/CLAUDE.md best practices and frontend security. Use when creating or reviewing a frontend feature/component for Mundial-2026 (e.g. leaderboard, prediction form, quiniela list).
---

# react-feature

Genera o revisa una feature completa de frontend React para Mundial-2026, alineada con [frontend/CLAUDE.md](../../../frontend/CLAUDE.md). Úsalo al crear/revisar un componente o feature (p. ej. el `Leaderboard`, el formulario de `Prediccion`, la lista de `Quinielas`).

## Antes de empezar
1. Lee `frontend/CLAUDE.md` (reglas vinculantes) y el `CLAUDE.md` raíz (dominio + seguridad transversal).
2. Identifica el contrato del backend (endpoints, request/response) para alinear los tipos. Si existe la feature equivalente en backend, reutiliza su forma.

## Estructura a generar (feature-based)
Para una feature `xxx`, crea bajo `src/features/xxx/`:

```
features/xxx/
├── api/xxx.api.ts        # llamadas tipadas (apiClient) + factory de query keys
├── schemas/xxx.schema.ts # Zod schema + tipos (z.infer)
├── hooks/useXxx.ts       # useQuery / useMutation (TanStack Query)
└── components/Xxx.tsx     # UI (shadcn/ui)
```

## Reglas que el código DEBE cumplir
- **Estado de servidor → TanStack Query**, nunca Zustand ni `useEffect`+fetch.
  - Query keys jerárquicos en una factory; incluir todas las variables que cambian.
  - Mutaciones → `queryClient.invalidateQueries` de las keys afectadas.
  - Manejar `isLoading`/`isError`.
- **Estado de cliente/UI → Zustand** con selectores atómicos (solo si hace falta estado global de UI).
- **Sin `useEffect` para derivar/transformar estado** (calcular en render o `useMemo`); `useEffect` solo para sistemas externos.
- **Formularios → Zod (`z.infer`) + RHF (`zodResolver`)**, esquema alineado al contrato del backend.
- **TypeScript:** sin `any`; props y respuestas tipadas (idealmente `z.infer`).
- **Seguridad:** sin secretos en `import.meta.env.VITE_*` (es público); sin `dangerouslySetInnerHTML` inseguro; recordar que la validación del form es UX y el backend revalida.
- **Accesibilidad:** labels en inputs, foco, navegación por teclado, primitivas shadcn/Radix.

## Plantillas

```ts
// schemas/prediccion.schema.ts
import { z } from "zod";
export const prediccionSchema = z.object({
  golesLocal: z.number().int().min(0).max(20),
  golesVisitante: z.number().int().min(0).max(20),
});
export type PrediccionForm = z.infer<typeof prediccionSchema>;
```

```ts
// hooks/useQuinielas.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
export const quinielaKeys = {
  all: ["quinielas"] as const,
  detail: (id: number) => ["quiniela", id] as const,
};
export function useQuinielas() {
  return useQuery({ queryKey: quinielaKeys.all, queryFn: fetchQuinielas, staleTime: 60_000 });
}
export function useCrearQuiniela() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: crearQuiniela,
    onSuccess: () => qc.invalidateQueries({ queryKey: quinielaKeys.all }),
  });
}
```

## Al revisar (modo review)
Recorre los archivos y verifica el **checklist final** de `frontend/CLAUDE.md`. Reporta cada incumplimiento con `archivo:línea` y la regla violada. Presta atención especial a: `useEffect` para fetching/estado derivado, estado de servidor en Zustand, `any`, y secretos en `VITE_*`.

## Cierre
- Ejecuta `eslint` (incl. `react-hooks`) y `tsc --noEmit`; reporta el resultado real.
