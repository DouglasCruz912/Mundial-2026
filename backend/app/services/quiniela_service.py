import secrets

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.participacion import Participacion
from app.models.prediccion import Prediccion
from app.models.quiniela import Quiniela
from app.schemas.quiniela import QuinielaCreate

# Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L)
_ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
_MAX_INTENTOS = 5


def _generar_codigo() -> str:
    sufijo = "".join(secrets.choice(_ALFABETO) for _ in range(4))
    return f"MUND-{sufijo}"


async def crear(session: AsyncSession, datos: QuinielaCreate, creador_id: int) -> Quiniela:
    """Crea la quiniela y la participación del creador en una sola transacción."""
    ultimo_error: IntegrityError | None = None
    for _ in range(_MAX_INTENTOS):
        quiniela = Quiniela(
            nombre=datos.nombre,
            descripcion=datos.descripcion,
            codigo_invitacion=_generar_codigo(),
            creador_id=creador_id,
        )
        session.add(quiniela)
        try:
            await session.flush()
        except IntegrityError as exc:
            await session.rollback()
            ultimo_error = exc
            continue
        session.add(Participacion(usuario_id=creador_id, quiniela_id=quiniela.id))
        await session.commit()
        await session.refresh(quiniela)
        return quiniela
    raise RuntimeError("No se pudo generar un código de invitación único") from ultimo_error


async def obtener_participacion(
    session: AsyncSession, usuario_id: int, quiniela_id: int
) -> Participacion | None:
    result = await session.execute(
        select(Participacion).where(
            Participacion.usuario_id == usuario_id,
            Participacion.quiniela_id == quiniela_id,
        )
    )
    return result.scalar_one_or_none()


async def obtener_por_codigo(session: AsyncSession, codigo: str) -> Quiniela | None:
    result = await session.execute(
        select(Quiniela).where(Quiniela.codigo_invitacion == codigo)
    )
    return result.scalar_one_or_none()


async def unirse(session: AsyncSession, quiniela: Quiniela, usuario_id: int) -> Participacion:
    participacion = Participacion(usuario_id=usuario_id, quiniela_id=quiniela.id)
    session.add(participacion)
    await session.commit()
    await session.refresh(participacion)
    return participacion


async def listar_del_usuario(
    session: AsyncSession, usuario_id: int, limit: int, offset: int
) -> list[dict]:
    """Quinielas donde participa el usuario, con nº de participantes y sus puntos.

    Una sola consulta con agregados (sin N+1).
    """
    propia = (
        select(Participacion.quiniela_id, Participacion.id.label("participacion_id"))
        .where(Participacion.usuario_id == usuario_id)
        .subquery()
    )
    conteo = (
        select(
            Participacion.quiniela_id,
            func.count(Participacion.id).label("participantes"),
        )
        .group_by(Participacion.quiniela_id)
        .subquery()
    )
    puntos = (
        select(
            Prediccion.participacion_id,
            func.coalesce(func.sum(Prediccion.puntos), 0).label("mis_puntos"),
        )
        .group_by(Prediccion.participacion_id)
        .subquery()
    )
    stmt = (
        select(
            Quiniela,
            conteo.c.participantes,
            func.coalesce(puntos.c.mis_puntos, 0).label("mis_puntos"),
        )
        .join(propia, propia.c.quiniela_id == Quiniela.id)
        .join(conteo, conteo.c.quiniela_id == Quiniela.id)
        .outerjoin(puntos, puntos.c.participacion_id == propia.c.participacion_id)
        .order_by(Quiniela.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await session.execute(stmt)
    return [
        {
            **{
                k: getattr(quiniela, k)
                for k in (
                    "id",
                    "nombre",
                    "descripcion",
                    "codigo_invitacion",
                    "creador_id",
                    "created_at",
                )
            },
            "participantes": participantes,
            "mis_puntos": mis_puntos,
        }
        for quiniela, participantes, mis_puntos in result.all()
    ]


async def contar_participantes(session: AsyncSession, quiniela_id: int) -> int:
    result = await session.execute(
        select(func.count(Participacion.id)).where(Participacion.quiniela_id == quiniela_id)
    )
    return result.scalar_one()
