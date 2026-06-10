"""Promueve a admin al usuario cuyo email está en ADMIN_EMAIL (.env).

El usuario debe existir (registrarse primero vía /api/v1/auth/register).

Uso: python -m scripts.create_admin
"""

import asyncio

from sqlalchemy import select

from app.config import get_settings
from app.db.session import async_session_maker
from app.models.usuario import Usuario


async def main() -> None:
    email = get_settings().admin_email
    if not email:
        raise SystemExit("ADMIN_EMAIL no está configurado en .env")

    async with async_session_maker() as session:
        usuario = (
            await session.execute(select(Usuario).where(Usuario.email == email))
        ).scalar_one_or_none()
        if usuario is None:
            raise SystemExit(f"No existe un usuario con email {email}: regístralo primero")
        usuario.rol = "admin"
        await session.commit()
        print(f"{email} ahora es admin")


if __name__ == "__main__":
    asyncio.run(main())
