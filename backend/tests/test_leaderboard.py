from datetime import datetime, timedelta, timezone

from httpx import AsyncClient

from app.core.security import get_password_hash
from app.models.partido import Partido
from app.models.usuario import Usuario


async def test_leaderboard_no_participante_404(
    client: AsyncClient, auth_headers: dict, otro_auth_headers: dict
):
    quiniela = (
        await client.post("/api/v1/quinielas", json={"nombre": "Privada"}, headers=auth_headers)
    ).json()
    resp = await client.get(
        f"/api/v1/quinielas/{quiniela['id']}/leaderboard", headers=otro_auth_headers
    )
    assert resp.status_code == 404


async def test_leaderboard_orden_y_desempate(
    client: AsyncClient,
    session,
    auth_headers: dict,
    otro_auth_headers: dict,
    admin_headers: dict,
    usuario: Usuario,
    otro_usuario: Usuario,
    admin: Usuario,
    partido_futuro: Partido,
):
    """3 participantes, 2 partidos: verifica orden por puntos y desempate por exactos."""
    # Segundo partido futuro
    partido2 = Partido(
        numero=99,
        equipo_local="España",
        equipo_visitante="Francia",
        fecha_hora=datetime.now(timezone.utc) + timedelta(days=1),
        fase="grupos",
        grupo="C",
    )
    session.add(partido2)
    await session.commit()
    await session.refresh(partido2)

    quiniela = (
        await client.post("/api/v1/quinielas", json={"nombre": "Liga"}, headers=auth_headers)
    ).json()
    codigo = quiniela["codigo_invitacion"]
    url_pred = f"/api/v1/quinielas/{quiniela['id']}/predicciones"
    for headers in (otro_auth_headers, admin_headers):
        assert (
            await client.post("/api/v1/quinielas/join", json={"codigo": codigo}, headers=headers)
        ).status_code == 200

    # Resultados reales serán: P1 2-1, P2 1-1
    # Ana:   P1 2-1 (3), P2 0-0 (1)  -> 4 pts, 1 exacto
    # Beto:  P1 1-0 (1), P2 1-1 (3)  -> 4 pts, 1 exacto  (empata con Ana, desempate por nombre)
    # Admin: P1 0-1 (0), P2 2-2 (1)  -> 1 pt
    predicciones = [
        (auth_headers, partido_futuro.id, 2, 1),
        (auth_headers, partido2.id, 0, 0),
        (otro_auth_headers, partido_futuro.id, 1, 0),
        (otro_auth_headers, partido2.id, 1, 1),
        (admin_headers, partido_futuro.id, 0, 1),
        (admin_headers, partido2.id, 2, 2),
    ]
    for headers, partido_id, gl, gv in predicciones:
        resp = await client.put(
            url_pred,
            json={"partido_id": partido_id, "goles_local": gl, "goles_visitante": gv},
            headers=headers,
        )
        assert resp.status_code == 200, resp.text

    # Kickoff: mover ambos al pasado y cargar resultados
    pasado = datetime.now(timezone.utc) - timedelta(hours=3)
    partido_futuro.fecha_hora = pasado
    partido2.fecha_hora = pasado
    await session.commit()
    for partido_id, gl, gv in ((partido_futuro.id, 2, 1), (partido2.id, 1, 1)):
        resp = await client.put(
            f"/api/v1/partidos/{partido_id}/resultado",
            json={"goles_local": gl, "goles_visitante": gv},
            headers=admin_headers,
        )
        assert resp.status_code == 200

    resp = await client.get(
        f"/api/v1/quinielas/{quiniela['id']}/leaderboard", headers=auth_headers
    )
    assert resp.status_code == 200
    tabla = resp.json()
    assert [e["nombre"] for e in tabla] == ["Ana", "Beto", "Admin"]
    assert [e["posicion"] for e in tabla] == [1, 2, 3]
    assert tabla[0]["puntos_total"] == 4
    assert tabla[1]["puntos_total"] == 4
    assert tabla[2]["puntos_total"] == 1
    assert tabla[0]["aciertos_exactos"] == 1
    assert tabla[0]["predicciones_evaluadas"] == 2


async def test_leaderboard_sin_predicciones_muestra_ceros(
    client: AsyncClient, auth_headers: dict, usuario: Usuario
):
    quiniela = (
        await client.post("/api/v1/quinielas", json={"nombre": "Nueva"}, headers=auth_headers)
    ).json()
    resp = await client.get(
        f"/api/v1/quinielas/{quiniela['id']}/leaderboard", headers=auth_headers
    )
    assert resp.status_code == 200
    tabla = resp.json()
    assert len(tabla) == 1
    assert tabla[0]["puntos_total"] == 0
    assert tabla[0]["predicciones_evaluadas"] == 0
