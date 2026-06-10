from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import _DUMMY_HASH, get_password_hash, verify_password
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate


async def obtener_por_email(session: AsyncSession, email: str) -> Usuario | None:
    result = await session.execute(select(Usuario).where(Usuario.email == email))
    return result.scalar_one_or_none()


async def crear(session: AsyncSession, datos: UsuarioCreate) -> Usuario:
    usuario = Usuario(
        email=datos.email,
        nombre=datos.nombre,
        hashed_password=get_password_hash(datos.password),
    )
    session.add(usuario)
    await session.commit()
    await session.refresh(usuario)
    return usuario


async def autenticar(session: AsyncSession, email: str, password: str) -> Usuario | None:
    usuario = await obtener_por_email(session, email)
    if usuario is None:
        # Anti-enumeración: igualar el tiempo de respuesta verificando un hash dummy
        verify_password(password, _DUMMY_HASH)
        return None
    if not verify_password(password, usuario.hashed_password):
        return None
    return usuario
