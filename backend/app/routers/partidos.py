from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Security, status

from app.core.security import get_current_active_user
from app.db.session import SessionDep
from app.models.usuario import Usuario
from app.schemas.partido import PartidoPublic, ResultadoUpdate
from app.services import partido_service

router = APIRouter(prefix="/api/v1/partidos", tags=["partidos"])

Autenticado = Annotated[Usuario, Security(get_current_active_user, scopes=["me"])]
Admin = Annotated[Usuario, Security(get_current_active_user, scopes=["admin"])]


@router.get("", response_model=list[PartidoPublic])
async def listar_partidos(
    session: SessionDep,
    user: Autenticado,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
    fase: str | None = None,
) -> list[PartidoPublic]:
    partidos = await partido_service.listar(session, limit, offset, fase)
    return [PartidoPublic.model_validate(p) for p in partidos]


@router.put("/{partido_id}/resultado", response_model=PartidoPublic)
async def registrar_resultado(
    partido_id: int, datos: ResultadoUpdate, session: SessionDep, user: Admin
) -> PartidoPublic:
    partido = await partido_service.obtener(session, partido_id)
    if partido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partido no encontrado")
    if not partido_service.ya_comenzo(partido):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede registrar el resultado de un partido que no ha comenzado",
        )
    partido = await partido_service.registrar_resultado(session, partido, datos)
    return PartidoPublic.model_validate(partido)
