from typing import Annotated

from fastapi import APIRouter, HTTPException, Security, status

from app.core.security import get_current_active_user
from app.db.session import SessionDep
from app.models.usuario import Usuario
from app.schemas.leaderboard import LeaderboardEntry
from app.services import leaderboard_service, quiniela_service

router = APIRouter(prefix="/api/v1/quinielas/{quiniela_id}/leaderboard", tags=["leaderboard"])

Lector = Annotated[Usuario, Security(get_current_active_user, scopes=["quinielas:read"])]


@router.get("", response_model=list[LeaderboardEntry])
async def leaderboard(
    quiniela_id: int, session: SessionDep, user: Lector
) -> list[LeaderboardEntry]:
    # Ownership: 404 si no participa (no revelar existencia)
    participacion = await quiniela_service.obtener_participacion(session, user.id, quiniela_id)
    if participacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Quiniela no encontrada"
        )
    return await leaderboard_service.por_quiniela(session, quiniela_id)
