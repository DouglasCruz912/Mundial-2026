from httpx import AsyncClient

from app.models.usuario import Usuario


async def test_register_devuelve_201_sin_password(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "nuevo@test.com", "nombre": "Nuevo", "password": "password123"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "nuevo@test.com"
    assert body["rol"] == "user"
    assert "hashed_password" not in body
    assert "password" not in body


async def test_register_email_duplicado_409(client: AsyncClient, usuario: Usuario):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": usuario.email, "nombre": "Otra", "password": "password123"},
    )
    assert resp.status_code == 409


async def test_register_password_corta_422(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "x@test.com", "nombre": "X", "password": "corta"},
    )
    assert resp.status_code == 422


async def test_register_campo_extra_422(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "x@test.com", "nombre": "X", "password": "password123", "rol": "admin"},
    )
    assert resp.status_code == 422


async def test_login_ok_devuelve_token_y_cookie(client: AsyncClient, usuario: Usuario):
    resp = await client.post(
        "/api/v1/token", data={"username": usuario.email, "password": "password123"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert "refresh_token" in resp.cookies


async def test_login_password_incorrecta_401_generico(client: AsyncClient, usuario: Usuario):
    resp = await client.post(
        "/api/v1/token", data={"username": usuario.email, "password": "incorrecta1"}
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Incorrect username or password"


async def test_login_usuario_inexistente_mismo_401(client: AsyncClient):
    resp = await client.post(
        "/api/v1/token", data={"username": "nadie@test.com", "password": "password123"}
    )
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Incorrect username or password"


async def test_me_con_token(client: AsyncClient, usuario: Usuario, auth_headers: dict):
    resp = await client.get("/api/v1/usuarios/me", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == usuario.email
    assert "hashed_password" not in body


async def test_me_sin_token_401(client: AsyncClient):
    resp = await client.get("/api/v1/usuarios/me")
    assert resp.status_code == 401


async def test_refresh_devuelve_nuevo_access(client: AsyncClient, usuario: Usuario):
    login = await client.post(
        "/api/v1/token", data={"username": usuario.email, "password": "password123"}
    )
    refresh_cookie = login.cookies["refresh_token"]
    resp = await client.post("/api/v1/token/refresh", cookies={"refresh_token": refresh_cookie})
    assert resp.status_code == 200
    assert resp.json()["access_token"]


async def test_refresh_sin_cookie_401(client: AsyncClient):
    resp = await client.post("/api/v1/token/refresh")
    assert resp.status_code == 401


async def test_access_token_no_sirve_como_refresh(client: AsyncClient, usuario: Usuario):
    login = await client.post(
        "/api/v1/token", data={"username": usuario.email, "password": "password123"}
    )
    access = login.json()["access_token"]
    resp = await client.post("/api/v1/token/refresh", cookies={"refresh_token": access})
    assert resp.status_code == 401
