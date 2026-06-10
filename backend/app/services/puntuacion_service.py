from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.partido import Partido
from app.models.prediccion import Prediccion

PUNTOS_EXACTO = 3
PUNTOS_RESULTADO = 1
PUNTOS_FALLO = 0


def _signo(goles_local: int, goles_visitante: int) -> int:
    """-1 gana visitante, 0 empate, 1 gana local."""
    if goles_local > goles_visitante:
        return 1
    if goles_local < goles_visitante:
        return -1
    return 0


def calcular_puntos(
    pred_local: int, pred_visitante: int, real_local: int, real_visitante: int
) -> int:
    """Esquema clásico fijo: exacto=3, acertar G/E/P=1, fallo=0."""
    if pred_local == real_local and pred_visitante == real_visitante:
        return PUNTOS_EXACTO
    if _signo(pred_local, pred_visitante) == _signo(real_local, real_visitante):
        return PUNTOS_RESULTADO
    return PUNTOS_FALLO


async def evaluar_partido(session: AsyncSession, partido: Partido) -> int:
    """Recalcula los puntos de TODAS las predicciones del partido.

    Idempotente: re-ejecutar tras una corrección de resultado simplemente
    sobreescribe los puntos. No commitea: el caller controla la transacción.
    """
    assert partido.goles_local is not None and partido.goles_visitante is not None
    result = await session.execute(
        select(Prediccion).where(Prediccion.partido_id == partido.id)
    )
    predicciones = result.scalars().all()
    for pred in predicciones:
        pred.puntos = calcular_puntos(
            pred.goles_local, pred.goles_visitante, partido.goles_local, partido.goles_visitante
        )
    return len(predicciones)
