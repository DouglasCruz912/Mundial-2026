from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, Security, status

from app.core.security import get_current_active_user
from app.db.session import SessionDep
from app.models.usuario import Usuario
from app.schemas.prediccion import PrediccionPublic, PrediccionUpsert
from app.services import partido_service, prediccion_service, quiniela_service

router = APIRouter(prefix="/api/v1/quinielas/{quiniela_id}/predicciones", tags=["predicciones"])

Lector = Annotated[Usuario, Security(get_current_active_user, scopes=["quinielas:read"])]
Escritor = Annotated[Usuario, Security(get_current_active_user, scopes=["quinielas:write"])]


async def _participacion_propia(session: SessionDep, usuario_id: int, quiniela_id: int):
    # Ownership (BOLA): la participación se resuelve SIEMPRE del usuario autenticado
    participacion = await quiniela_service.obtener_participacion(session, usuario_id, quiniela_id)
    if participacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Quiniela no encontrada"
        )
    return participacion


@router.put("", response_model=PrediccionPublic)
async def guardar_prediccion(
    quiniela_id: int, datos: PrediccionUpsert, session: SessionDep, user: Escritor
) -> PrediccionPublic:
    participacion = await _participacion_propia(session, user.id, quiniela_id)

    partido = await partido_service.obtener(session, datos.partido_id)
    if partido is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partido no encontrado")
    # Lock autoritativo: ni tras el kickoff ni con resultado cargado
    if partido_service.ya_comenzo(partido) or partido.goles_local is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El partido ya comenzó: la predicción está cerrada",
        )

    prediccion = await prediccion_service.upsert(session, participacion, datos)
    return PrediccionPublic.model_validate(prediccion)


@router.get("/me", response_model=list[PrediccionPublic])
async def mis_predicciones(
    quiniela_id: int,
    session: SessionDep,
    user: Lector,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[PrediccionPublic]:
    participacion = await _participacion_propia(session, user.id, quiniela_id)
    predicciones = await prediccion_service.listar_de_participacion(
        session, participacion.id, limit, offset
    )
    return [PrediccionPublic.model_validate(p) for p in predicciones]
