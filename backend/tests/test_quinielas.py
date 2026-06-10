import re

from httpx import AsyncClient


async def _crear_quiniela(client: AsyncClient, headers: dict, nombre: str = "La de amigos") -> dict:
    resp = await client.post(
        "/api/v1/quinielas", json={"nombre": nombre}, headers=headers
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


async def test_crear_quiniela_genera_codigo(client: AsyncClient, auth_headers: dict):
    body = await _crear_quiniela(client, auth_headers)
    assert re.fullmatch(r"MUND-[A-Z0-9]{4}", body["codigo_invitacion"])
    assert body["nombre"] == "La de amigos"


async def test_crear_quiniela_sin_token_401(client: AsyncClient):
    resp = await client.post("/api/v1/quinielas", json={"nombre": "Sin auth"})
    assert resp.status_code == 401


async def test_creador_queda_como_participante(client: AsyncClient, auth_headers: dict):
    await _crear_quiniela(client, auth_headers)
    resp = await client.get("/api/v1/quinielas", headers=auth_headers)
    assert resp.status_code == 200
    quinielas = resp.json()
    assert len(quinielas) == 1
    assert quinielas[0]["participantes"] == 1
    assert quinielas[0]["mis_puntos"] == 0


async def test_unirse_con_codigo(client: AsyncClient, auth_headers: dict, otro_auth_headers: dict):
    creada = await _crear_quiniela(client, auth_headers)
    resp = await client.post(
        "/api/v1/quinielas/join",
        json={"codigo": creada["codigo_invitacion"]},
        headers=otro_auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == creada["id"]

    lista = (await client.get("/api/v1/quinielas", headers=otro_auth_headers)).json()
    assert len(lista) == 1
    assert lista[0]["participantes"] == 2


async def test_unirse_codigo_invalido_404(client: AsyncClient, auth_headers: dict):
    resp = await client.post(
        "/api/v1/quinielas/join", json={"codigo": "MUND-XXXX"}, headers=auth_headers
    )
    assert resp.status_code == 404


async def test_unirse_codigo_mal_formado_422(client: AsyncClient, auth_headers: dict):
    resp = await client.post(
        "/api/v1/quinielas/join", json={"codigo": "hola"}, headers=auth_headers
    )
    assert resp.status_code == 422


async def test_unirse_dos_veces_409(client: AsyncClient, auth_headers: dict, otro_auth_headers: dict):
    creada = await _crear_quiniela(client, auth_headers)
    codigo = creada["codigo_invitacion"]
    primera = await client.post(
        "/api/v1/quinielas/join", json={"codigo": codigo}, headers=otro_auth_headers
    )
    assert primera.status_code == 200
    segunda = await client.post(
        "/api/v1/quinielas/join", json={"codigo": codigo}, headers=otro_auth_headers
    )
    assert segunda.status_code == 409


async def test_detalle_no_participante_404(
    client: AsyncClient, auth_headers: dict, otro_auth_headers: dict
):
    creada = await _crear_quiniela(client, auth_headers)
    resp = await client.get(f"/api/v1/quinielas/{creada['id']}", headers=otro_auth_headers)
    assert resp.status_code == 404


async def test_detalle_participante_ok(client: AsyncClient, auth_headers: dict):
    creada = await _crear_quiniela(client, auth_headers)
    resp = await client.get(f"/api/v1/quinielas/{creada['id']}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["participantes"] == 1


async def test_listado_paginado_limit_max_100(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/quinielas?limit=101", headers=auth_headers)
    assert resp.status_code == 422
