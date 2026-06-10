from sqlalchemy import Integer, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.participacion import Participacion
from app.models.prediccion import Prediccion
from app.models.usuario import Usuario
from app.schemas.leaderboard import LeaderboardEntry
from app.services.puntuacion_service import PUNTOS_EXACTO


async def por_quiniela(session: AsyncSession, quiniela_id: int) -> list[LeaderboardEntry]:
    """Ranking calculado en una sola consulta agregada.

    Desempate determinista: puntos DESC → aciertos exactos DESC → nombre ASC.
    """
    puntos_total = func.coalesce(func.sum(Prediccion.puntos), 0).label("puntos_total")
    aciertos_exactos = func.coalesce(
        func.sum(case((Prediccion.puntos == PUNTOS_EXACTO, 1), else_=0)), 0
    ).label("aciertos_exactos")
    evaluadas = func.count(Prediccion.puntos).cast(Integer).label("evaluadas")

    stmt = (
        select(Usuario.id, Usuario.nombre, puntos_total, aciertos_exactos, evaluadas)
        .join(Participacion, Participacion.usuario_id == Usuario.id)
        .outerjoin(Prediccion, Prediccion.participacion_id == Participacion.id)
        .where(Participacion.quiniela_id == quiniela_id)
        .group_by(Usuario.id, Usuario.nombre)
        .order_by(puntos_total.desc(), aciertos_exactos.desc(), Usuario.nombre.asc())
    )
    result = await session.execute(stmt)
    return [
        LeaderboardEntry(
            posicion=i + 1,
            usuario_id=usuario_id,
            nombre=nombre,
            puntos_total=puntos,
            aciertos_exactos=exactos,
            predicciones_evaluadas=evaluadas_count,
        )
        for i, (usuario_id, nombre, puntos, exactos, evaluadas_count) in enumerate(result.all())
    ]
