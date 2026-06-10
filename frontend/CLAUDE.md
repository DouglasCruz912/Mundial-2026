# Frontend — React (Mundial-2026)

> Reglas para el frontend. Se cargan al trabajar bajo `frontend/`.
> Stack: **React · TypeScript · Vite · Tailwind · shadcn/ui · React Hook Form · Zod · TanStack Query · Zustand**.
> Seguridad transversal y dominio: ver [../CLAUDE.md](../CLAUDE.md).

Fundamentado en docs oficiales: [react.dev/reference/rules](https://react.dev/reference/rules), [react.dev/learn/you-might-not-need-an-effect](https://react.dev/learn/you-might-not-need-an-effect), [tanstack.com/query](https://tanstack.com/query/latest), [zod.dev](https://zod.dev/), [react-hook-form.com](https://react-hook-form.com/), [vite.dev/guide/env-and-mode](https://vite.dev/guide/env-and-mode).

## Estructura (feature-based)

```
frontend/src/
├── app/                  # router, providers (QueryClientProvider), layout
├── components/ui/        # primitivas shadcn/ui (reutilizables)
├── features/
│   ├── quinielas/
│   │   ├── components/   # UI de la feature
│   │   ├── hooks/        # useQuinielas, useCreateQuiniela (TanStack Query)
│   │   ├── api/          # llamadas fetch/axios tipadas
│   │   └── schemas/      # esquemas Zod + tipos (z.infer)
│   ├── predicciones/
│   └── leaderboard/
├── lib/                  # apiClient, queryClient, utils
└── stores/               # stores Zustand (estado de cliente/UI)
```

- **Colocación:** lo de una feature vive junto. Solo se sube a `components/ui` o `lib/` lo realmente compartido.
- Alias de imports (`@/`) configurado en Vite + tsconfig.

## Rules of React / Hooks (obligatorio)

- **Componentes y hooks puros:** `render` debe ser puro, sin efectos secundarios. Mismas props/estado → misma salida.
- **Props y estado son inmutables:** nunca mutarlos; crear nuevos objetos/arrays.
- **Hooks solo en el top level** del componente/hook (no en condicionales, loops ni funciones anidadas) y **solo** desde componentes React o custom hooks.
- **Nunca** llamar a un componente como función (`MiComp()`); usarlo como JSX (`<MiComp />`).
- Activar **Strict Mode** y el **ESLint plugin `react-hooks`** (con la regla `exhaustive-deps`).

## "You Might Not Need an Effect" — `useEffect` es el último recurso

`useEffect` es **solo** para sincronizar con sistemas externos (suscripciones, listeners del DOM, widgets de terceros). **No** lo uses para:

1. **Transformar datos para render** → calcula en el cuerpo del componente. `const nombre = `${first} ${last}``.
2. **Cachear cálculos caros** → `useMemo`, no `useEffect` + `setState`.
3. **Responder a eventos de usuario** → lógica en el **event handler**, no en un effect.
4. **Resetear estado al cambiar una prop** → usa `key` en el componente.
5. **Ajustar estado según props** → calcula en render o ajusta durante el render con el patrón `prev`.
6. **Encadenar actualizaciones de estado** → hazlas en un solo handler.
7. **Notificar al padre de un cambio** → llama al callback del padre en el mismo handler.
8. **Fetching de datos** → usa **TanStack Query**, nunca `useEffect` + `fetch`.

## TypeScript

- `strict: true`. **Prohibido `any`** (usar `unknown` + narrowing si hace falta).
- Tipar props con `type`/`interface`; tipar **todas** las respuestas de API (idealmente derivadas de Zod con `z.infer`).
- Uniones discriminadas para estados/variantes; evitar aserciones `as` salvo casos justificados.

## TanStack Query — estado de **servidor**

- **Todo el estado de servidor vive en TanStack Query, NO en Zustand.** (quinielas, partidos, predicciones, leaderboard).
- **Nunca** hacer fetch en `useEffect`; usar `useQuery`/`useMutation`.
- **Query keys** como array jerárquico y serializable; incluir **todas** las variables que cambian:
  - lista: `['quinielas']`
  - detalle: `['quiniela', id]`
  - filtrada: `['predicciones', { quinielaId, usuarioId }]`
  - El **orden de los elementos del array importa**; el orden de claves dentro de un objeto no.
- Mantén las keys colocadas con la feature (p. ej. una factory `quinielaKeys` en `features/quinielas/api`).
- **Mutaciones:** tras éxito, `queryClient.invalidateQueries({ queryKey: [...] })` para refrescar.
- Configurar `staleTime`/`gcTime` según el dato (p. ej. leaderboard con `staleTime` corto; lista de partidos más largo).
- Manejar siempre `isLoading`/`isError` (o `Suspense` + Error Boundary).

```ts
export const quinielaKeys = {
  all: ['quinielas'] as const,
  detail: (id: number) => ['quiniela', id] as const,
};
export function useQuinielas() {
  return useQuery({ queryKey: quinielaKeys.all, queryFn: fetchQuinielas, staleTime: 60_000 });
}
```

## Zustand — estado de **cliente/UI**

- Solo para estado **de cliente** (tema, modales abiertos, filtros de UI, paso de un wizard). **No** para datos del servidor.
- **Selectores atómicos** para evitar re-renders: `useStore(s => s.theme)`, no desestructurar todo el store.
- Organizar por slices si crece.

## Formularios — React Hook Form + Zod

- **El esquema Zod es la única fuente de verdad** de la forma y validación del formulario.
- Conectar con `zodResolver`; derivar el tipo con `z.infer<typeof schema>`.
- Alinear el esquema con el **contrato del backend** (mismos campos/restricciones). Recuerda: **esto es UX; el backend revalida**.

```ts
const prediccionSchema = z.object({
  golesLocal: z.number().int().min(0).max(20),
  golesVisitante: z.number().int().min(0).max(20),
});
type PrediccionForm = z.infer<typeof prediccionSchema>;
const form = useForm<PrediccionForm>({ resolver: zodResolver(prediccionSchema) });
```

## Seguridad (frontend)

- **XSS:** React auto-escapa el contenido. `dangerouslySetInnerHTML` está **prohibido** salvo con HTML sanitizado (DOMPurify) y justificación.
- **`import.meta.env.VITE_*` es PÚBLICO** (queda en el bundle). **Nunca** poner secretos/keys ahí. Solo URLs públicas y flags. Las credenciales viven en el backend.
- **Tokens:** preferir **cookie `httpOnly`** (gestionada por el backend) sobre `localStorage` (vulnerable a XSS). Si se usa storage, asumir el riesgo y minimizar superficie.
- **La validación de frontend es UX, no seguridad:** el backend siempre revalida y autoriza.
- No exponer datos de otras quinielas/usuarios: pedir solo lo que el usuario puede ver; la autorización real es del backend.
- Considerar **CSP** en el hosting.

## Performance

- Code splitting por ruta con `React.lazy` + `Suspense`.
- Memoizar (`useMemo`/`useCallback`/`React.memo`) **solo cuando se mide** un problema real; no por defecto.
- Listas: `key` estable y única (no el índice si la lista cambia de orden).
- Analizar el bundle antes de optimizar.

## Accesibilidad

- HTML semántico; usar las primitivas accesibles de **shadcn/ui (Radix)**.
- Todos los inputs con `label` asociado; estados de error anunciados; foco visible; navegable por teclado.

## Checklist antes de terminar una feature

- [ ] Estado de servidor en TanStack Query (no en Zustand), con query keys correctos.
- [ ] Sin `useEffect` para derivar/transformar estado ni para fetching.
- [ ] Formularios con Zod (`z.infer`) + RHF, alineados al contrato del backend.
- [ ] Sin `any`; props y respuestas tipadas.
- [ ] Sin secretos en `VITE_*`; sin `dangerouslySetInnerHTML` inseguro.
- [ ] Accesibilidad: labels, foco, teclado.
- [ ] `eslint` (incl. `react-hooks`) y `tsc --noEmit` pasan.
