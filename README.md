# ⚽ Mundial 2026 — Quinielas entre amigos

Plataforma gratuita de **quinielas (pools de predicciones) del Mundial de fútbol 2026**. Proyecto de portafolio: React + FastAPI con buenas prácticas y seguridad (OWASP API Top 10).

## Funcionalidad

- Crea quinielas y comparte el **código de invitación** (`MUND-XXXX`) con tus amigos.
- Predice el marcador de cada partido **antes del kickoff** (después se bloquea).
- Puntuación clásica: **marcador exacto = 3 pts · acertar ganador/empate = 1 pt · fallo = 0**.
- **Tabla de posiciones** por quiniela (desempate: puntos → exactos → nombre).
- Un admin carga los resultados reales; los puntos se recalculan automáticamente (las correcciones también).

## Stack

| Capa | Tecnologías |
|---|---|
| Frontend | React 19 · TypeScript (strict) · Vite · Tailwind v4 · shadcn/ui · TanStack Query · Zustand · React Hook Form + Zod |
| Backend | FastAPI · Pydantic v2 · SQLAlchemy 2.0 (async) · Alembic · OAuth2 + JWT (Argon2) · pytest |
| Infra | PostgreSQL 16 (Docker) · docker-compose |

Las reglas de desarrollo viven en [CLAUDE.md](CLAUDE.md), [backend/CLAUDE.md](backend/CLAUDE.md) y [frontend/CLAUDE.md](frontend/CLAUDE.md).

## Levantar en local

Requisitos: Python 3.12+, Node 20+, Docker.

### 1. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements-dev.txt
copy .env.example .env   # completar SECRET_KEY (python -c "import secrets; print(secrets.token_hex(32))")

docker compose up db -d            # PostgreSQL
.venv\Scripts\alembic upgrade head # migraciones
.venv\Scripts\python -m scripts.seed_partidos   # fixture (104 partidos)

.venv\Scripts\python -m uvicorn app.main:app --reload   # http://localhost:8000/docs
```

Para crear el admin: regístrate en la app con el email que pongas en `ADMIN_EMAIL` del `.env` y corre `python -m scripts.create_admin`.

### 2. Frontend

```powershell
cd frontend
npm install
copy .env.example .env   # VITE_API_URL=http://localhost:8000
npm run dev              # http://localhost:5173
```

### Tests y checks

```powershell
cd backend;  .venv\Scripts\python -m pytest          # 47 tests
cd frontend; npx tsc --noEmit -p tsconfig.app.json; npx eslint src
```

## Estructura

```
├── backend/
│   ├── app/{main,config}.py      # FastAPI app + settings
│   ├── app/core/                 # security (JWT/Argon2/scopes), errores, rate limit
│   ├── app/models/               # ORM: usuarios, quinielas, participaciones, partidos, predicciones
│   ├── app/schemas/              # Pydantic input/output (sin campos sensibles en salida)
│   ├── app/services/             # negocio: puntuación 3/1/0, leaderboard, etc.
│   ├── app/routers/              # APIRouter por dominio (/api/v1)
│   ├── migrations/               # Alembic
│   ├── scripts/                  # seed_partidos, create_admin, generar_fixture
│   └── tests/                    # pytest (éxito + 401/403/409/422)
└── frontend/src/
    ├── app/                      # router (lazy), providers, layout, rutas protegidas
    ├── features/                 # auth, quinielas, partidos, predicciones, leaderboard, admin
    │   └── <feature>/{api,schemas,hooks,components}
    ├── components/ui/            # shadcn/ui
    ├── lib/                      # apiClient (Zod-validado, refresh automático)
    └── stores/                   # Zustand (solo estado de UI)
```

## Notas

- El fixture usa equipos placeholder (`Equipo A2`, `1° Grupo A`); el seed es **idempotente por número de partido**: edita `backend/app/db/seed/partidos_2026.json` con los equipos reales y re-ejecuta `seed_partidos`.
- Si el proyecto vive dentro de OneDrive, marca la carpeta como "Conservar siempre en este dispositivo" (o exclúyela del sync) para evitar lentitud con `node_modules`/`.venv`.
- Próximamente: mini-juegos adicionales.
