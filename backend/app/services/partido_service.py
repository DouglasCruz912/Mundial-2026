from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.partido import Partido
from app.schemas.partido import ResultadoUpdate
from app.services.puntuacion_service import evaluar_partido


def ahora_utc() -> datetime:
    return datetime.now(timezone.utc)


def _aware_utc(dt: datetime) -> datetime:
    """SQLite de test devuelve datetimes naive; normalizar a aware-UTC."""
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


def ya_comenzo(partido: Partido) -> bool:
    return ahora_utc() >= _aware_utc(partido.fecha_hora)


async def obtener(session: AsyncSession, partido_id: int) -> Partido | None:
    result = await session.execute(select(Partido).where(Partido.id == partido_id))
    return result.scalar_one_or_none()


async def listar(
    session: AsyncSession,
    limit: int,
    offset: int,
    fase: str | None = None,
) -> list[Partido]:
    stmt = (
        select(Partido)
        .order_by(Partido.fecha_hora, Partido.numero)
        .limit(limit)
        .offset(offset)
    )
    if fase is not None:
        stmt = stmt.where(Partido.fase == fase)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def registrar_resultado(
    session: AsyncSession, partido: Partido, datos: ResultadoUpdate
) -> Partido:
    """Setea el resultado y reevalúa todas las predicciones, atómicamente."""
    partido.goles_local = datos.goles_local
    partido.goles_visitante = datos.goles_visitante
    await evaluar_partido(session, partido)
    await session.commit()
    await session.refresh(partido)
    return partido
