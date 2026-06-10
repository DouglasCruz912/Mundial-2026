import os
from collections.abc import AsyncGenerator
from datetime import datetime, timedelta, timezone

# Config de test ANTES de importar la app (get_settings cachea)
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.rate_limit import limiter
from app.core.security import get_password_hash

# El rate limiting se prueba aparte; desactivado para no acumular 429 entre tests
limiter.enabled = False
from app.db.base import Base
from app.db.session import get_session
from app.main import app
from app.models import Partido, Participacion, Prediccion, Quiniela, Usuario  # noqa: F401


@pytest.fixture
async def session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    maker = async_sessionmaker(engine, expire_on_commit=False)
    async with maker() as s:
        yield s
    await engine.dispose()


@pytest.fixture
async def client(session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield session

    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
async def usuario(session: AsyncSession) -> Usuario:
    u = Usuario(
        email="ana@test.com",
        nombre="Ana",
        hashed_password=get_password_hash("password123"),
    )
    session.add(u)
    await session.commit()
    await session.refresh(u)
    return u


@pytest.fixture
async def otro_usuario(session: AsyncSession) -> Usuario:
    u = Usuario(
        email="beto@test.com",
        nombre="Beto",
        hashed_password=get_password_hash("password123"),
    )
    session.add(u)
    await session.commit()
    await session.refresh(u)
    return u


@pytest.fixture
async def admin(session: AsyncSession) -> Usuario:
    u = Usuario(
        email="admin@test.com",
        nombre="Admin",
        hashed_password=get_password_hash("password123"),
        rol="admin",
    )
    session.add(u)
    await session.commit()
    await session.refresh(u)
    return u


async def _login(client: AsyncClient, email: str) -> dict[str, str]:
    resp = await client.post("/api/v1/token", data={"username": email, "password": "password123"})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.fixture
async def auth_headers(client: AsyncClient, usuario: Usuario) -> dict[str, str]:
    return await _login(client, usuario.email)


@pytest.fixture
async def otro_auth_headers(client: AsyncClient, otro_usuario: Usuario) -> dict[str, str]:
    return await _login(client, otro_usuario.email)


@pytest.fixture
async def admin_headers(client: AsyncClient, admin: Usuario) -> dict[str, str]:
    return await _login(client, admin.email)


@pytest.fixture
async def partido_futuro(session: AsyncSession) -> Partido:
    p = Partido(
        numero=1,
        equipo_local="México",
        equipo_visitante="Por definir (A2)",
        fecha_hora=datetime.now(timezone.utc) + timedelta(days=1),
        fase="grupos",
        grupo="A",
    )
    session.add(p)
    await session.commit()
    await session.refresh(p)
    return p


@pytest.fixture
async def partido_pasado(session: AsyncSession) -> Partido:
    p = Partido(
        numero=2,
        equipo_local="Argentina",
        equipo_visitante="Brasil",
        fecha_hora=datetime.now(timezone.utc) - timedelta(hours=2),
        fase="grupos",
        grupo="B",
    )
    session.add(p)
    await session.commit()
    await session.refresh(p)
    return p
