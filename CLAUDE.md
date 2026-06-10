# Mundial-2026 — Quiniela del Mundial de Fútbol 2026

> Reglas de trabajo para Claude Code y el equipo. Este archivo se carga **siempre**.
> Para reglas específicas: ver [frontend/CLAUDE.md](frontend/CLAUDE.md) y [backend/CLAUDE.md](backend/CLAUDE.md).

## Qué es este proyecto

Plataforma **gratuita, tipo portafolio, entre amigos**, para jugar **quinielas (pools de predicciones)** del **Mundial de fútbol 2026**. Sin fines de lucro: priorizamos **simplicidad, claridad y buenas prácticas** como muestra de portafolio.

Funcionalidad núcleo:
- Pueden existir **múltiples quinielas** simultáneas; cada una tiene sus **participantes**.
- Cada usuario ve **los partidos en los que participa**, el **avance de sus predicciones** y **cuántos puntos lleva**.
- Hay una **tabla de posiciones (leaderboard)** por quiniela.
- Habrá **otros mini-juegos** más adelante (a definir).

## Glosario de dominio

| Entidad | Significado |
|---|---|
| `Usuario` | Persona registrada en la plataforma. |
| `Quiniela` | Pool de predicciones. Puede haber muchas en paralelo. |
| `Participacion` | Relación usuario ↔ quiniela (un usuario puede estar en varias). |
| `Partido` | Fixture del Mundial (equipos, fecha, resultado real). |
| `Prediccion` | Pronóstico de un usuario para un partido dentro de una quiniela. |
| `Puntuacion` | Puntos obtenidos al evaluar predicciones contra el resultado real. |
| `Leaderboard` | Ranking de participantes de una quiniela ordenado por puntos. |

**Reglas de negocio base:**
- Un usuario puede estar en varias quinielas a la vez.
- Las predicciones se cierran al iniciar el partido (no se editan después del kickoff).
- Las predicciones se evalúan contra el resultado real para asignar puntos según el esquema de puntuación de la quiniela.
- El leaderboard ordena participantes por puntos (desempates a definir).
- Un usuario solo puede ver/editar **sus** predicciones; solo ve quinielas en las que participa.

## Estructura del monorepo

```
Mundial-2026/
├── frontend/   # React + TypeScript + Vite  (SPA)  → ver frontend/CLAUDE.md
├── backend/    # FastAPI + Pydantic v2 + SQLAlchemy → ver backend/CLAUDE.md
└── .claude/
    └── skills/ # fastapi-feature, react-feature, stack-security-audit
```

- **Comunicación:** el frontend consume la API REST del backend (JSON tipado). El contrato lo define el backend.
- **Idioma:** documentación y nombres de dominio en **español**; el código sigue las convenciones de cada lenguaje (Python: `snake_case`; TS/React: `camelCase`/`PascalCase`).

## Seguridad — principios transversales (leer siempre)

1. **El backend es la única fuente de verdad de seguridad y validación.** La validación del frontend es solo UX. **Toda** entrada se vuelve a validar y autorizar en el servidor.
2. **Autorización por dueño (BOLA/IDOR):** nunca confíes en IDs que manda el cliente para decidir acceso. Verifica que el `Usuario` autenticado sea dueño del recurso (su `Prediccion`, su `Participacion`) antes de leer/escribir.
3. **Secretos:** nunca hardcodear ni commitear secretos. `.env` siempre en `.gitignore`.
   - Backend: configuración vía `pydantic-settings` + variables de entorno.
   - Frontend: **todo lo que empiece con `VITE_` es PÚBLICO** (queda embebido en el bundle). Jamás poner secretos ahí. Las claves/credenciales viven solo en el backend.
4. **Contrato compartido:** los esquemas de request/response del backend (Pydantic) deben reflejarse en los esquemas **Zod** del frontend. Mantén ambos sincronizados; un cambio en uno obliga a revisar el otro.
5. **No filtrar datos:** las respuestas usan modelos de salida que **excluyen** campos sensibles (p. ej. `hashed_password`). Nunca devolver la entidad de DB cruda.
6. **Errores sin fugas:** no exponer stack traces ni errores internos al cliente; loggear internamente y devolver mensajes seguros.

## Convenciones generales

- **Commits:** mensajes claros e imperativos; un cambio lógico por commit. No commitear `.env`, secretos, ni artefactos de build (`node_modules/`, `dist/`, `__pycache__/`, `.venv/`).
- **Ramas:** trabajar en ramas de feature; no commitear directo a `main` salvo que se indique.
- **Antes de dar algo por terminado:** correr linters/tests del subproyecto afectado y reportar el resultado real (si algo falla, decirlo).

## Skills disponibles

Usa estos skills para mantener las prácticas de forma repetible:

- **`/fastapi-feature`** — scaffold o review de una feature de backend (router + schemas + modelo + servicio + auth + tests) siguiendo [backend/CLAUDE.md](backend/CLAUDE.md).
- **`/react-feature`** — scaffold o review de una feature de frontend (componente + hooks TanStack Query + Zod/RHF + Zustand) siguiendo [frontend/CLAUDE.md](frontend/CLAUDE.md).
- **`/stack-security-audit`** — auditoría de seguridad del stack (OWASP API Top 10 en back; XSS/secretos/tokens en front).
