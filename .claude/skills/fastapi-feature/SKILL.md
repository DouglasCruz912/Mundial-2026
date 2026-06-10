---
name: fastapi-feature
description: Scaffold or review a complete FastAPI backend feature (APIRouter + Pydantic schemas + SQLAlchemy model + service + auth + tests) following the project's backend/CLAUDE.md best practices and OWASP API Security. Use when creating or reviewing a backend endpoint/feature for Mundial-2026 (e.g. Quiniela, Prediccion, Partido, Leaderboard).
---

# fastapi-feature

Genera o revisa una feature completa de backend FastAPI para Mundial-2026, alineada con [backend/CLAUDE.md](../../../backend/CLAUDE.md). Úsalo cuando el usuario pida crear/revisar un endpoint o recurso (p. ej. una `Prediccion`, `Quiniela`, `Partido`, `Leaderboard`).

## Antes de empezar
1. Lee `backend/CLAUDE.md` (reglas vinculantes) y el `CLAUDE.md` raíz (dominio + seguridad transversal).
2. Pregunta o infiere: nombre de la entidad, campos, qué scope/permisos requiere, si necesita verificación de ownership.

## Qué generar (orden)
Para una entidad `Xxx`, crea/edita:

1. **Modelo ORM** en `app/models/xxx.py` — `Mapped[...]` + `mapped_column(...)`, FKs con `ForeignKey`, índices donde aplique.
2. **Schemas Pydantic** en `app/schemas/xxx.py`:
   - `XxxCreate` (entrada; `extra="forbid"`, restricciones con `Field`).
   - `XxxUpdate` (opcional, campos opcionales).
   - `XxxPublic` (salida; `ConfigDict(from_attributes=True)`; **sin** campos sensibles).
3. **Servicio** en `app/services/xxx_service.py` — lógica de negocio; recibe la `AsyncSession` como parámetro (no la crea). Aquí va la lógica de dominio (p. ej. evaluación de predicciones, cálculo de puntos).
4. **Router** en `app/routers/xxx.py` — `APIRouter(prefix="/api/v1/xxx", tags=["xxx"])`, registrar en `app/main.py`.
5. **Tests** en `tests/test_xxx.py` — éxito + 401 + 403 + 422.

## Reglas que el código DEBE cumplir
- **`response_model`** declarado en cada endpoint; devolver `XxxPublic`, nunca el modelo ORM crudo.
- **Auth:** dependencia `CurrentUser` + `Security(..., scopes=["xxx:read"|"xxx:write"])` según corresponda.
- **Ownership (OWASP API1/BOLA):** si el recurso pertenece a un usuario (p. ej. `Prediccion`, `Participacion`), verificar que `recurso.usuario_id == current_user.id` antes de leer/editar. Nunca autorizar solo por el ID del path. Si no es dueño → `404`/`403`.
- **Sesión async inyectada** (`SessionDep`); consultas con `select(...).where(...)`; evitar N+1 con `selectinload`.
- **Listados con paginación:** `limit: int = Query(20, le=100)`, `offset`.
- **Errores:** `HTTPException` con mensajes seguros; nunca exponer detalles internos.
- **Async correcto:** `async def` + `await`; sin I/O bloqueante.

## Plantilla de router

```python
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from app.core.security import get_current_active_user
from app.db.session import SessionDep
from app.models.user import User
from app.schemas.xxx import XxxCreate, XxxPublic
from app.services import xxx_service

router = APIRouter(prefix="/api/v1/xxx", tags=["xxx"])
CurrentUser = Annotated[User, Depends(get_current_active_user)]

@router.post("", response_model=XxxPublic, status_code=status.HTTP_201_CREATED)
async def crear_xxx(payload: XxxCreate, session: SessionDep,
                    user: Annotated[User, Security(get_current_active_user, scopes=["xxx:write"])]):
    return await xxx_service.crear(session, payload, owner_id=user.id)

@router.get("/{xxx_id}", response_model=XxxPublic)
async def obtener_xxx(xxx_id: int, session: SessionDep, user: CurrentUser):
    obj = await xxx_service.obtener(session, xxx_id)
    if obj is None or obj.usuario_id != user.id:   # ownership
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No encontrado")
    return obj
```

## Al revisar (modo review)
Recorre el archivo y verifica el **checklist final** de `backend/CLAUDE.md`. Reporta cada incumplimiento con `archivo:línea` y la regla violada.

## Cierre
- Ejecuta los tests (`pytest`) y reporta el resultado real.
- Recuerda al usuario que el frontend debe reflejar el contrato (schema Zod) con `/react-feature`.
