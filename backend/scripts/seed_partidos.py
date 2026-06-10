"""Carga/actualiza el fixture del Mundial 2026 desde partidos_2026.json.

Idempotente: upsert por `numero`. Actualiza equipos/fecha/fase si el partido
ya existe, pero NUNCA toca los goles (resultados cargados por el admin).

Uso: python -m scripts.seed_partidos
"""

import asyncio
import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import select

from app.db.session import async_session_maker
from app.models.partido import Partido

SEED_FILE = Path(__file__).resolve().parent.parent / "app" / "db" / "seed" / "partidos_2026.json"


async def main() -> None:
    datos = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    creados = actualizados = 0

    async with async_session_maker() as session:
        existentes = {
            p.numero: p
            for p in (await session.execute(select(Partido))).scalars().all()
        }
        for entrada in datos:
            fecha = datetime.fromisoformat(entrada["fecha_hora"].replace("Z", "+00:00"))
            partido = existentes.get(entrada["numero"])
            if partido is None:
                session.add(
                    Partido(
                        numero=entrada["numero"],
                        fase=entrada["fase"],
                        grupo=entrada["grupo"],
                        equipo_local=entrada["equipo_local"],
                        equipo_visitante=entrada["equipo_visitante"],
                        fecha_hora=fecha,
                    )
                )
                creados += 1
            else:
                partido.fase = entrada["fase"]
                partido.grupo = entrada["grupo"]
                partido.equipo_local = entrada["equipo_local"]
                partido.equipo_visitante = entrada["equipo_visitante"]
                partido.fecha_hora = fecha
                actualizados += 1
        await session.commit()

    print(f"Seed completado: {creados} creados, {actualizados} actualizados")


if __name__ == "__main__":
    asyncio.run(main())
