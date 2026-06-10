from httpx import AsyncClient

from app.models.partido import Partido


async def test_listar_partidos_autenticado(
    client: AsyncClient, auth_headers: dict, partido_futuro: Partido
):
    resp = await client.get("/api/v1/partidos", headers=auth_headers)
    assert resp.status_code == 200
    partidos = resp.json()
    assert len(partidos) == 1
    assert partidos[0]["equipo_local"] == "México"
    assert partidos[0]["goles_local"] is None


async def test_listar_partidos_sin_token_401(client: AsyncClient):
    resp = await client.get("/api/v1/partidos")
    assert resp.status_code == 401


async def test_registrar_resultado_requiere_admin_403(
    client: AsyncClient, auth_headers: dict, partido_pasado: Partido
):
    resp = await client.put(
        f"/api/v1/partidos/{partido_pasado.id}/resultado",
        json={"goles_local": 2, "goles_visitante": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 403


async def test_admin_registra_resultado(
    client: AsyncClient, admin_headers: dict, partido_pasado: Partido
):
    resp = await client.put(
        f"/api/v1/partidos/{partido_pasado.id}/resultado",
        json={"goles_local": 2, "goles_visitante": 1},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["goles_local"] == 2
    assert body["goles_visitante"] == 1


async def test_resultado_partido_futuro_409(
    client: AsyncClient, admin_headers: dict, partido_futuro: Partido
):
    resp = await client.put(
        f"/api/v1/partidos/{partido_futuro.id}/resultado",
        json={"goles_local": 1, "goles_visitante": 0},
        headers=admin_headers,
    )
    assert resp.status_code == 409


async def test_resultado_goles_invalidos_422(
    client: AsyncClient, admin_headers: dict, partido_pasado: Partido
):
    resp = await client.put(
        f"/api/v1/partidos/{partido_pasado.id}/resultado",
        json={"goles_local": 25, "goles_visitante": 0},
        headers=admin_headers,
    )
    assert resp.status_code == 422
