from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.participacion import Participacion
from app.models.prediccion import Prediccion
from app.schemas.prediccion import PrediccionUpsert


async def upsert(
    session: AsyncSession, participacion: Participacion, datos: PrediccionUpsert
) -> Prediccion:
    """Crea o actualiza la predicción del participante para un partido.

    El caller ya validó ownership y que el partido no comenzó.
    """
    result = await session.execute(
        select(Prediccion).where(
            Prediccion.participacion_id == participacion.id,
            Prediccion.partido_id == datos.partido_id,
        )
    )
    prediccion = result.scalar_one_or_none()
    if prediccion is None:
        prediccion = Prediccion(
            participacion_id=participacion.id,
            partido_id=datos.partido_id,
            goles_local=datos.goles_local,
            goles_visitante=datos.goles_visitante,
        )
        session.add(prediccion)
    else:
        prediccion.goles_local = datos.goles_local
        prediccion.goles_visitante = datos.goles_visitante
    await session.commit()
    await session.refresh(prediccion)
    return prediccion


async def listar_de_participacion(
    session: AsyncSession, participacion_id: int, limit: int, offset: int
) -> list[Prediccion]:
    result = await session.execute(
        select(Prediccion)
        .where(Prediccion.participacion_id == participacion_id)
        .order_by(Prediccion.partido_id)
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all())
