"""Genera app/db/seed/partidos_2026.json desde el calendario oficial.

Fuente: openfootball/worldcup (github.com/openfootball/worldcup, 2026--usa),
vendorizada en app/db/seed/fuentes/. Incluye fechas y horas oficiales con la
zona horaria de cada sede (se convierten a UTC) y los cruces reales de las
eliminatorias (2A v 2B, W74, etc.).

Numeración: fase de grupos 1-72 en orden cronológico; eliminatorias 73-104
según numeración oficial del archivo. El seed (seed_partidos.py) hace upsert
por `numero` y nunca toca resultados.

Uso: python -m scripts.generar_fixture
"""

import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

FUENTES = Path(__file__).resolve().parent.parent / "app" / "db" / "seed" / "fuentes"
DESTINO = Path(__file__).resolve().parent.parent / "app" / "db" / "seed" / "partidos_2026.json"

EQUIPO_ES = {
    "Mexico": "México",
    "South Africa": "Sudáfrica",
    "South Korea": "Corea del Sur",
    "Czech Republic": "Chequia",
    "Canada": "Canadá",
    "Bosnia & Herzegovina": "Bosnia y Herzegovina",
    "Qatar": "Catar",
    "Switzerland": "Suiza",
    "Brazil": "Brasil",
    "Haiti": "Haití",
    "Morocco": "Marruecos",
    "Scotland": "Escocia",
    "USA": "Estados Unidos",
    "Paraguay": "Paraguay",
    "Turkey": "Turquía",
    "Australia": "Australia",
    "Germany": "Alemania",
    "Ecuador": "Ecuador",
    "Curaçao": "Curazao",
    "Ivory Coast": "Costa de Marfil",
    "Netherlands": "Países Bajos",
    "Japan": "Japón",
    "Sweden": "Suecia",
    "Tunisia": "Túnez",
    "Belgium": "Bélgica",
    "Egypt": "Egipto",
    "Iran": "Irán",
    "New Zealand": "Nueva Zelanda",
    "Spain": "España",
    "Cape Verde": "Cabo Verde",
    "Saudi Arabia": "Arabia Saudita",
    "Uruguay": "Uruguay",
    "France": "Francia",
    "Iraq": "Irak",
    "Norway": "Noruega",
    "Senegal": "Senegal",
    "Argentina": "Argentina",
    "Algeria": "Argelia",
    "Austria": "Austria",
    "Jordan": "Jordania",
    "Portugal": "Portugal",
    "DR Congo": "RD Congo",
    "Uzbekistan": "Uzbekistán",
    "Colombia": "Colombia",
    "England": "Inglaterra",
    "Croatia": "Croacia",
    "Ghana": "Ghana",
    "Panama": "Panamá",
}

MES = {"June": 6, "Jun": 6, "July": 7, "Jul": 7}

FASE_POR_SECCION = {
    "Round of 32": "dieciseisavos",
    "Round of 16": "octavos",
    "Quarter-final": "cuartos",
    "Semi-final": "semifinal",
    "Match for third place": "tercer_puesto",
    "Final": "final",
}

RE_FECHA = re.compile(r"^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(June|July|Jun|Jul)\s+(\d{1,2})\s*$")
RE_GRUPO = re.compile(r"^▪ Group ([A-L])\s*$")
RE_PARTIDO_GRUPO = re.compile(
    r"^\s+(\d{1,2}):(\d{2}) UTC([+-]\d{1,2})\s+(.+?)\s+v\s+(.+?)\s+@\s+(.+?)\s*$"
)
RE_PARTIDO_FINAL = re.compile(
    r"^\s*\((\d{2,3})\)\s+(\d{1,2}):(\d{2}) UTC([+-]\d{1,2})\s+(\S+)\s+v\s+(\S+)\s+@\s+(.+?)\s*$"
)


def a_utc(mes: str, dia: int, hora: int, minuto: int, offset: int) -> datetime:
    local = datetime(2026, MES[mes], dia, hora, minuto, tzinfo=timezone(timedelta(hours=offset)))
    return local.astimezone(timezone.utc)


def etiqueta_eliminatoria(token: str) -> str:
    """Traduce los códigos del bracket: 2A, 1E, 3A/B/C/D/F, W74, L101."""
    if token.startswith("W"):
        return f"Ganador P{token[1:]}"
    if token.startswith("L"):
        return f"Perdedor P{token[1:]}"
    posicion, grupos = token[0], token[1:]
    if "/" in grupos:
        return f"{posicion}° Grupo {grupos}"
    return f"{posicion}° Grupo {grupos}"


def parsear_grupos() -> list[dict]:
    partidos: list[dict] = []
    grupo: str | None = None
    fecha: tuple[str, int] | None = None
    for linea in (FUENTES / "openfootball_cup.txt").read_text(encoding="utf-8").splitlines():
        if m := RE_GRUPO.match(linea):
            grupo = m.group(1)
            continue
        if grupo is None:
            continue
        if m := RE_FECHA.match(linea.strip()):
            fecha = (m.group(1), int(m.group(2)))
            continue
        if (m := RE_PARTIDO_GRUPO.match(linea)) and fecha is not None:
            hora, minuto, offset = int(m.group(1)), int(m.group(2)), int(m.group(3))
            local_en, visitante_en = m.group(4).strip(), m.group(5).strip()
            partidos.append(
                {
                    "fase": "grupos",
                    "grupo": grupo,
                    "equipo_local": EQUIPO_ES[local_en],
                    "equipo_visitante": EQUIPO_ES[visitante_en],
                    "fecha_hora": a_utc(fecha[0], fecha[1], hora, minuto, offset),
                }
            )
    assert len(partidos) == 72, f"Se esperaban 72 partidos de grupos, hay {len(partidos)}"
    # Numeración cronológica (desempate por grupo para orden estable)
    partidos.sort(key=lambda p: (p["fecha_hora"], p["grupo"]))
    for i, p in enumerate(partidos, start=1):
        p["numero"] = i
    return partidos


def parsear_finales() -> list[dict]:
    partidos: list[dict] = []
    fase: str | None = None
    fecha: tuple[str, int] | None = None
    for linea in (
        (FUENTES / "openfootball_cup_finals.txt").read_text(encoding="utf-8").splitlines()
    ):
        if linea.startswith("▪"):
            seccion = linea.lstrip("▪").strip()
            fase = FASE_POR_SECCION.get(seccion)
            continue
        if fase is None:
            continue
        if m := RE_FECHA.match(linea.strip()):
            fecha = (m.group(1), int(m.group(2)))
            continue
        if (m := RE_PARTIDO_FINAL.match(linea)) and fecha is not None:
            numero = int(m.group(1))
            hora, minuto, offset = int(m.group(2)), int(m.group(3)), int(m.group(4))
            partidos.append(
                {
                    "numero": numero,
                    "fase": fase,
                    "grupo": None,
                    "equipo_local": etiqueta_eliminatoria(m.group(5)),
                    "equipo_visitante": etiqueta_eliminatoria(m.group(6)),
                    "fecha_hora": a_utc(fecha[0], fecha[1], hora, minuto, offset),
                }
            )
    assert len(partidos) == 32, f"Se esperaban 32 partidos de eliminatorias, hay {len(partidos)}"
    return partidos


def main() -> None:
    partidos = parsear_grupos() + parsear_finales()
    assert len(partidos) == 104
    assert sorted(p["numero"] for p in partidos) == list(range(1, 105))
    serializables = [
        {**p, "fecha_hora": p["fecha_hora"].isoformat().replace("+00:00", "Z")}
        for p in sorted(partidos, key=lambda x: x["numero"])
    ]
    DESTINO.write_text(
        json.dumps(serializables, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Generados {len(serializables)} partidos en {DESTINO}")
    inaugural = serializables[0]
    print(f"Inaugural: {inaugural['equipo_local']} vs {inaugural['equipo_visitante']} — {inaugural['fecha_hora']}")
    print(f"Final: {serializables[-1]['fecha_hora']}")


if __name__ == "__main__":
    main()
