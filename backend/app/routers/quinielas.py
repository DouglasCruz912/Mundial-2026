from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Request, Security, status

from app.core.rate_limit import limiter
from app.core.security import get_current_active_user
from app.db.session import SessionDep
from app.models.usuario import Usuario
from app.schemas.quiniela import QuinielaCreate, QuinielaJoin, QuinielaPublic, QuinielaResumen
from app.services import quiniela_service

router = APIRouter(prefix="/api/v1/quinielas", tags=["quinielas"])

LectorQuinielas = Annotated[Usuario, Security(get_current_active_user, scopes=["quinielas:read"])]
EscritorQuinielas = Annotated[
    Usuario, Security(get_current_active_user, scopes=["quinielas:write"])
]


@router.post("", response_model=QuinielaPublic, status_code=status.HTTP_201_CREATED)
async def crear_quiniela(
    datos: QuinielaCreate, session: SessionDep, user: EscritorQuinielas
) -> QuinielaPublic:
    quiniela = await quiniela_service.crear(session, datos, creador_id=user.id)
    return QuinielaPublic.model_validate(quiniela)


@router.get("", response_model=list[QuinielaResumen])
async def mis_quinielas(
    session: SessionDep,
    user: LectorQuinielas,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[QuinielaResumen]:
    filas = await quiniela_service.listar_del_usuario(session, user.id, limit, offset)
    return [QuinielaResumen.model_validate(f) for f in filas]


@router.post("/join", response_model=QuinielaPublic)
@limiter.limit("10/minute")
async def unirse_a_quiniela(
    request: Request, datos: QuinielaJoin, session: SessionDep, user: EscritorQuinielas
) -> QuinielaPublic:
    quiniela = await quiniela_service.obtener_por_codigo(session, datos.codigo)
    if quiniela is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Código de invitación inválido"
        )
    existente = await quiniela_service.obtener_participacion(session, user.id, quiniela.id)
    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Ya participas en esta quiniela"
        )
    await quiniela_service.unirse(session, quiniela, user.id)
    return QuinielaPublic.model_validate(quiniela)


@router.get("/{quiniela_id}", response_model=QuinielaResumen)
async def detalle_quiniela(
    quiniela_id: int, session: SessionDep, user: LectorQuinielas
) -> QuinielaResumen:
    # Ownership (BOLA): 404 si no participa, sin revelar existencia
    participacion = await quiniela_service.obtener_participacion(session, user.id, quiniela_id)
    if participacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Quiniela no encontrada"
        )
    filas = await quiniela_service.listar_del_usuario(session, user.id, limit=100, offset=0)
    detalle = next((f for f in filas if f["id"] == quiniela_id), None)
    if detalle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Quiniela no encontrada"
        )
    return QuinielaResumen.model_validate(detalle)
