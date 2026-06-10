# Backend — FastAPI (Mundial-2026)

> Reglas para el backend. Se cargan al trabajar bajo `backend/`.
> Stack: **FastAPI · Pydantic v2 · SQLAlchemy 2.0 (async) · Alembic · OAuth2/JWT · pytest · Docker · PostgreSQL**.
> Seguridad transversal y dominio: ver [../CLAUDE.md](../CLAUDE.md).

Fundamentado en docs oficiales: [fastapi.tiangolo.com](https://fastapi.tiangolo.com/), [docs.pydantic.dev](https://docs.pydantic.dev/latest/), [docs.sqlalchemy.org/en/20](https://docs.sqlalchemy.org/en/20/), [alembic.sqlalchemy.org](https://alembic.sqlalchemy.org/), [OWASP API Security Top 10 (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/).

## Estructura (FastAPI "Bigger Applications", dominio-basada)

```
backend/
├── app/
│   ├── main.py              # crea FastAPI(lifespan=...), incluye routers, middleware (CORS)
│   ├── config.py            # Settings (pydantic-settings) + get_settings() con @lru_cache
│   ├── core/
│   │   ├── security.py      # hashing, JWT, get_current_user, scopes
│   │   └── exceptions.py    # handlers de error
│   ├── db/
│   │   ├── base.py          # Base declarativa
│   │   └── session.py       # engine async, async_sessionmaker, get_session (dependencia)
│   ├── routers/             # 1 router por dominio (APIRouter)
│   │   ├── auth.py          # /token, /register
│   │   ├── quinielas.py
│   │   ├── predicciones.py
│   │   ├── partidos.py
│   │   └── leaderboard.py
│   ├── models/              # modelos ORM SQLAlchemy (db)
│   ├── schemas/             # modelos Pydantic (input/output)
│   └── services/            # lógica de negocio (puntuación, evaluación de predicciones)
├── migrations/              # Alembic
├── tests/                   # pytest (conftest.py + test_*.py)
├── Dockerfile
├── docker-compose.yml
└── pyproject.toml / requirements.txt
```

**Reglas de estructura:**
- Un `APIRouter` por dominio con `prefix` y `tags`; incluirlos en `main.py` con `app.include_router(...)`. No usar `@app.get` directo en módulos de dominio.
- **Nunca** instanciar/abrir sesiones de DB dentro de la lógica de negocio: se **inyectan** como dependencia.
- Separar siempre: `models/` (ORM) ≠ `schemas/` (Pydantic) ≠ `services/` (negocio).
- Versionar la API: prefijo `/api/v1`.

## Seguridad (lo más importante)

### Autenticación: OAuth2 password flow + JWT
- Login con `OAuth2PasswordRequestForm` en `POST /token`; proteger rutas con `OAuth2PasswordBearer(tokenUrl="api/v1/token", scopes={...})`.
- **Hash de contraseñas con `pwdlib` (Argon2)** (`PasswordHash.recommended()`) o bcrypt. **Nunca** texto plano.
- JWT firmado (HS256) con claims `sub` (id de usuario) y `exp`. **Access token 15–30 min**; usar **refresh tokens** para sesiones largas.
- `SECRET_KEY` desde entorno (`openssl rand -hex 32`), nunca hardcodeada.
- **Anti-enumeración/timing:** ante credenciales inválidas, ejecutar igualmente `verify_password` y devolver el mismo error genérico 401 (`"Incorrect username or password"`).

```python
from typing import Annotated
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer, SecurityScopes

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/token", scopes={
    "me": "Leer datos propios",
    "quinielas:read": "Ver quinielas",
    "quinielas:write": "Crear/editar quinielas",
    "admin": "Administración",
})

async def get_current_user(security_scopes: SecurityScopes,
                           token: Annotated[str, Depends(oauth2_scheme)]) -> User: ...
async def get_current_active_user(
    current_user: Annotated[User, Security(get_current_user, scopes=[])]) -> User: ...

CurrentUser = Annotated[User, Depends(get_current_active_user)]
```

### Autorización
- **Por scopes** para permisos de función: `Security(get_current_active_user, scopes=["quinielas:write"])`. Scopes con formato `recurso:accion`, guardados en el claim `scope` (string separado por espacios).
- **Por dueño (BOLA/IDOR — OWASP API1):** antes de leer/editar un recurso, verificar que pertenece al usuario autenticado. En este dominio: un usuario solo accede a **sus** `Prediccion`/`Participacion` y a quinielas donde participa. Nunca autorizar solo por el ID del path.

### CORS
- Orígenes **explícitos** (lista del frontend). **Jamás** `allow_origins=["*"]` junto con `allow_credentials=True`.

```python
app.add_middleware(CORSMiddleware,
    allow_origins=settings.allowed_origins, allow_credentials=True,
    allow_methods=["GET","POST","PUT","PATCH","DELETE"], allow_headers=["*"])
```

### Otros controles
- **Rate limiting** (SlowAPI o el gateway/reverse proxy) en login y endpoints sensibles (OWASP API4).
- **HTTPS** lo termina el reverse proxy (Traefik/Caddy/Nginx), no FastAPI.
- **Paginación obligatoria** en listados: `limit: int = Query(20, le=100)` para evitar consumo ilimitado.
- **SSRF (API7):** validar/allow-list cualquier URL externa antes de llamarla.
- **No filtrar datos:** ver `response_model` abajo.

### OWASP API Security Top 10 → mitigación
| Riesgo | Mitigación en FastAPI |
|---|---|
| API1 BOLA | Verificar ownership del recurso contra el usuario autenticado; no confiar en IDs del cliente. |
| API2 Broken Auth | OAuth2+JWT, Argon2, validar `exp`, 401 genérico. |
| API3 BOPLA | `response_model` que excluye campos sensibles; modelos input/output separados. |
| API4 Consumo ilimitado | Paginación (`le=100`), rate limiting. |
| API5 Broken Function Auth | Scopes con `Security(..., scopes=[...])`. |
| API7 SSRF | Validar URLs de usuario, allow-list. |
| API8 Misconfig | Config por entorno, sin secretos en código, CORS estricto. |
| API9 Inventory | OpenAPI auto + versionado `/api/v1`. |
| API10 Consumo inseguro de APIs | Validar respuestas de terceros, timeouts. |

## Pydantic v2

- **Modelos separados por propósito:** `XxxCreate` (entrada, incluye datos como password), `XxxPublic` (salida, **sin** campos sensibles), y el modelo ORM en `models/`.
- **Siempre declarar `response_model`** en los endpoints → valida y recorta campos extra automáticamente. Nunca devolver el modelo ORM crudo.
- `model_config = ConfigDict(from_attributes=True)` para convertir ORM → Pydantic. Usar `extra="forbid"` en modelos de entrada para rechazar campos desconocidos.
- Validación con `@field_validator` (un campo) y `@model_validator(mode="after")` (cross-field). Restringir longitudes/rangos con `Field(...)`.

```python
class PrediccionCreate(BaseModel):
    partido_id: int
    goles_local: int = Field(ge=0, le=20)
    goles_visitante: int = Field(ge=0, le=20)

class PrediccionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    partido_id: int
    goles_local: int
    goles_visitante: int
    puntos: int | None = None
```

## SQLAlchemy 2.0 (async)

- **Una `AsyncSession` por request** (no es thread/task-safe). Inyectar vía dependencia `get_session`.
- Estilo 2.0: `Mapped[...]` + `mapped_column(...)`; consultas con `select(Model).where(...)`; resultados con `.scalars().all()` / `.scalar_one_or_none()`.
- `await session.commit()` para persistir; `await session.refresh(obj)` para cargar IDs generados.
- **Evitar N+1:** cargar relaciones con `.options(selectinload(Model.rel))`.
- Transacciones atómicas con `async with session.begin():`.
- `expire_on_commit=False` en el sessionmaker.

```python
DATABASE_URL = "postgresql+asyncpg://user:pass@db/mundial"
engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

SessionDep = Annotated[AsyncSession, Depends(get_session)]
```

## Alembic

- `alembic init -t async migrations`; `target_metadata = Base.metadata`.
- **Siempre revisar** las migraciones autogeneradas (`--autogenerate` no detecta todo) antes de commitear.
- Usar convención de nombres de constraints en `Base.metadata` para nombres estables.
- Correr migraciones **antes** del arranque de la app (init container / `depends_on: condition: service_healthy`). Nunca editar `alembic_version` a mano.

## Manejo de errores

- Usar `HTTPException(status_code=..., detail=...)` con mensajes **seguros** (404 "Quiniela no encontrada", 403 "Sin permisos").
- Handler global que **loggea** el detalle interno y devuelve `{"detail": "Internal server error"}` con 500. **Nunca** exponer stack traces ni errores de DB.

## Configuración (pydantic-settings)

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)
    secret_key: str
    database_url: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    environment: str = "development"
    allowed_origins: list[str] = ["http://localhost:5173"]

@lru_cache
def get_settings() -> Settings: return Settings()
```

`.env` en `.gitignore`. En producción, inyectar variables por entorno (Docker/K8s secrets).

## Async correcto

- Endpoints y dependencias I/O-bound como `async def`; **siempre** `await` las llamadas async.
- **Nunca** `time.sleep()` ni I/O bloqueante en código async (bloquea el event loop) → usar `asyncio.sleep`.
- Trabajo post-respuesta ligero: `BackgroundTasks`. Trabajo pesado (recalcular puntuaciones de muchas quinielas): cola tipo Celery/RQ.

## Testing (pytest)

- `pytest` + `pytest-asyncio` + `httpx`. Sobrescribir `get_session` con DB de test vía `app.dependency_overrides`.
- DB de test aislada por test (fixtures en `conftest.py`). SQLite async en memoria para velocidad o Postgres de test.
- Probar **rutas de éxito y de error**: 200/201, 401 (sin token), 403 (sin scope/ownership), 422 (validación).
- Verificar que las respuestas **no** incluyen campos sensibles (`assert "hashed_password" not in body`).

## Docker

- `Dockerfile` con `python:3.12-slim`, deps cacheadas. `docker-compose.yml` con servicio `db` (Postgres + healthcheck) y `api` (`depends_on: db: condition: service_healthy`).
- Migraciones antes del arranque: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000`.

## Checklist antes de terminar un endpoint

- [ ] `APIRouter` por dominio, prefijo `/api/v1`, `tags`.
- [ ] Modelos Pydantic `Create`/`Public` separados; `response_model` declarado; sin campos sensibles en salida.
- [ ] Auth: `CurrentUser` + scope correcto; **verificación de ownership** donde aplique.
- [ ] Sesión async inyectada; consultas `select()`; sin N+1.
- [ ] Errores con `HTTPException` y mensajes seguros.
- [ ] Paginación en listados.
- [ ] Tests de éxito + 401/403/422.
