from httpx import AsyncClient

from app.models.partido import Partido


async def _crear_quiniela(client: AsyncClient, headers: dict) -> dict:
    resp = await client.post("/api/v1/quinielas", json={"nombre": "Test pool"}, headers=headers)
    assert resp.status_code == 201
    return resp.json()


async def test_guardar_prediccion_antes_del_kickoff(
    client: AsyncClient, auth_headers: dict, partido_futuro: Partido
):
    quiniela = await _crear_quiniela(client, auth_headers)
    resp = await client.put(
        f"/api/v1/quinielas/{quiniela['id']}/predicciones",
        json={"partido_id": partido_futuro.id, "goles_local": 2, "goles_visitante": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["goles_local"] == 2
    assert body["puntos"] is None  # sin evaluar


async def test_upsert_actualiza_misma_prediccion(
    client: AsyncClient, auth_headers: dict, partido_futuro: Partido
):
    quiniela = await _crear_quiniela(client, auth_headers)
    url = f"/api/v1/quinielas/{quiniela['id']}/predicciones"
    primera = await client.put(
        url,
        json={"partido_id": partido_futuro.id, "goles_local": 1, "goles_visitante": 0},
        headers=auth_headers,
    )
    segunda = await client.put(
        url,
        json={"partido_id": partido_futuro.id, "goles_local": 3, "goles_visitante": 2},
        headers=auth_headers,
    )
    assert segunda.status_code == 200
    assert segunda.json()["id"] == primera.json()["id"]
    assert segunda.json()["goles_local"] == 3

    listado = await client.get(f"{url}/me", headers=auth_headers)
    assert len(listado.json()) == 1


async def test_prediccion_tras_kickoff_409(
    client: AsyncClient, auth_headers: dict, partido_pasado: Partido
):
    quiniela = await _crear_quiniela(client, auth_headers)
    resp = await client.put(
        f"/api/v1/quinielas/{quiniela['id']}/predicciones",
        json={"partido_id": partido_pasado.id, "goles_local": 1, "goles_visitante": 0},
        headers=auth_headers,
    )
    assert resp.status_code == 409


async def test_prediccion_no_participante_404(
    client: AsyncClient, auth_headers: dict, otro_auth_headers: dict, partido_futuro: Partido
):
    quiniela = await _crear_quiniela(client, auth_headers)
    resp = await client.put(
        f"/api/v1/quinielas/{quiniela['id']}/predicciones",
        json={"partido_id": partido_futuro.id, "goles_local": 1, "goles_visitante": 0},
        headers=otro_auth_headers,
    )
    assert resp.status_code == 404


async def test_goles_fuera_de_rango_422(
    client: AsyncClient, auth_headers: dict, partido_futuro: Partido
):
    quiniela = await _crear_quiniela(client, auth_headers)
    resp = await client.put(
        f"/api/v1/quinielas/{quiniela['id']}/predicciones",
        json={"partido_id": partido_futuro.id, "goles_local": 21, "goles_visitante": 0},
        headers=auth_headers,
    )
    assert resp.status_code == 422


async def test_resultado_evalua_predicciones(
    client: AsyncClient,
    auth_headers: dict,
    otro_auth_headers: dict,
    admin_headers: dict,
    session,
    partido_futuro: Partido,
):
    """Flujo completo: predicen 2 usuarios → admin carga resultado → puntos 3/1/0."""
    quiniela = await _crear_quiniela(client, auth_headers)
    url = f"/api/v1/quinielas/{quiniela['id']}/predicciones"
    join = await client.post(
        "/api/v1/quinielas/join",
        json={"codigo": quiniela["codigo_invitacion"]},
        headers=otro_auth_headers,
    )
    assert join.status_code == 200

    # Ana predice 2-1 (exacto), Beto 1-0 (mismo signo)
    await client.put(
        url,
        json={"partido_id": partido_futuro.id, "goles_local": 2, "goles_visitante": 1},
        headers=auth_headers,
    )
    await client.put(
        url,
        json={"partido_id": partido_futuro.id, "goles_local": 1, "goles_visitante": 0},
        headers=otro_auth_headers,
    )

    # El partido "comienza": moverlo al pasado para poder cargar resultado
    from datetime import datetime, timedelta, timezone

    partido_futuro.fecha_hora = datetime.now(timezone.utc) - timedelta(hours=2)
    await session.commit()

    resp = await client.put(
        f"/api/v1/partidos/{partido_futuro.id}/resultado",
        json={"goles_local": 2, "goles_visitante": 1},
        headers=admin_headers,
    )
    assert resp.status_code == 200

    puntos_ana = (await client.get(f"{url}/me", headers=auth_headers)).json()[0]["puntos"]
    puntos_beto = (await client.get(f"{url}/me", headers=otro_auth_headers)).json()[0]["puntos"]
    assert puntos_ana == 3
    assert puntos_beto == 1

    # Corrección del admin → recálculo idempotente
    resp = await client.put(
        f"/api/v1/partidos/{partido_futuro.id}/resultado",
        json={"goles_local": 0, "goles_visitante": 1},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    puntos_ana = (await client.get(f"{url}/me", headers=auth_headers)).json()[0]["puntos"]
    puntos_beto = (await client.get(f"{url}/me", headers=otro_auth_headers)).json()[0]["puntos"]
    assert puntos_ana == 0
    assert puntos_beto == 0

    # Con resultado cargado, la predicción queda cerrada aunque se intente de nuevo
    cerrada = await client.put(
        url,
        json={"partido_id": partido_futuro.id, "goles_local": 0, "goles_visitante": 1},
        headers=auth_headers,
    )
    assert cerrada.status_code == 409
