"""Genera app/db/seed/partidos_2026.json con los 104 partidos del Mundial 2026.

Grupos según el sorteo oficial (dic 2025) + repechajes (mar 2026). Las
eliminatorias usan placeholders ("Ganador P74"): el seed es idempotente por
`numero`, así que basta re-ejecutarlo tras editar equipos/fechas, sin tocar
resultados ya cargados.

Uso: python -m scripts.generar_fixture
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

GRUPOS = "ABCDEFGHIJKL"
# Sorteo oficial del Mundial 2026 (cabeza de serie primero)
EQUIPOS_POR_GRUPO = {
    "A": ["México", "Sudáfrica", "Corea del Sur", "Chequia"],
    "B": ["Canadá", "Bosnia y Herzegovina", "Catar", "Suiza"],
    "C": ["Brasil", "Haití", "Marruecos", "Escocia"],
    "D": ["Estados Unidos", "Paraguay", "Turquía", "Australia"],
    "E": ["Alemania", "Ecuador", "Curazao", "Costa de Marfil"],
    "F": ["Países Bajos", "Japón", "Suecia", "Túnez"],
    "G": ["Bélgica", "Egipto", "Irán", "Nueva Zelanda"],
    "H": ["España", "Cabo Verde", "Arabia Saudita", "Uruguay"],
    "I": ["Francia", "Irak", "Noruega", "Senegal"],
    "J": ["Argentina", "Argelia", "Austria", "Jordania"],
    "K": ["Portugal", "Colombia", "RD Congo", "Uzbekistán"],
    "L": ["Inglaterra", "Croacia", "Ghana", "Panamá"],
}
# Horarios típicos de jornada (UTC)
HORAS = [16, 19, 22]

INICIO_GRUPOS = datetime(2026, 6, 11, tzinfo=timezone.utc)
# Emparejamientos por jornada dentro de un grupo (índices 1-4)
JORNADAS = [(1, 2), (3, 4), (1, 3), (4, 2), (4, 1), (2, 3)]


def nombre_equipo(grupo: str, pos: int) -> str:
    return EQUIPOS_POR_GRUPO[grupo][pos - 1]


def generar() -> list[dict]:
    partidos: list[dict] = []
    numero = 1

    # Fase de grupos: 12 grupos x 6 partidos = 72, en 3 jornadas (días 0-4, 5-9, 10-15)
    for jornada in range(3):
        for i, grupo in enumerate(GRUPOS):
            local_idx, visitante_idx = JORNADAS[jornada * 2], JORNADAS[jornada * 2 + 1]
            for par in (local_idx, visitante_idx):
                dia = jornada * 5 + (i // 3)
                hora = HORAS[i % 3]
                fecha = INICIO_GRUPOS + timedelta(days=dia, hours=hora)
                partidos.append(
                    {
                        "numero": numero,
                        "fase": "grupos",
                        "grupo": grupo,
                        "equipo_local": nombre_equipo(grupo, par[0]),
                        "equipo_visitante": nombre_equipo(grupo, par[1]),
                        "fecha_hora": fecha.isoformat().replace("+00:00", "Z"),
                    }
                )
                numero += 1

    def eliminatoria(
        fase: str, cantidad: int, inicio: datetime, etiqueta, por_dia: int = 2
    ) -> None:
        nonlocal numero
        for i in range(cantidad):
            fecha = inicio + timedelta(days=i // por_dia, hours=HORAS[i % por_dia])
            local, visitante = etiqueta(i)
            partidos.append(
                {
                    "numero": numero,
                    "fase": fase,
                    "grupo": None,
                    "equipo_local": local,
                    "equipo_visitante": visitante,
                    "fecha_hora": fecha.isoformat().replace("+00:00", "Z"),
                }
            )
            numero += 1

    # Dieciseisavos (ronda de 32): partidos 73-88
    eliminatoria(
        "dieciseisavos",
        16,
        datetime(2026, 6, 28, tzinfo=timezone.utc),
        lambda i: (f"Clasificado {2*i+1}", f"Clasificado {2*i+2}"),
        por_dia=3,
    )
    # Octavos: 89-96
    eliminatoria(
        "octavos",
        8,
        datetime(2026, 7, 4, tzinfo=timezone.utc),
        lambda i: (f"Ganador P{73+2*i}", f"Ganador P{74+2*i}"),
    )
    # Cuartos: 97-100
    eliminatoria(
        "cuartos",
        4,
        datetime(2026, 7, 9, tzinfo=timezone.utc),
        lambda i: (f"Ganador P{89+2*i}", f"Ganador P{90+2*i}"),
    )
    # Semifinales: 101-102
    eliminatoria(
        "semifinal",
        2,
        datetime(2026, 7, 14, tzinfo=timezone.utc),
        lambda i: (f"Ganador P{97+2*i}", f"Ganador P{98+2*i}"),
    )
    # Tercer puesto: 103
    eliminatoria(
        "tercer_puesto",
        1,
        datetime(2026, 7, 18, tzinfo=timezone.utc),
        lambda i: ("Perdedor P101", "Perdedor P102"),
    )
    # Final: 104
    eliminatoria(
        "final",
        1,
        datetime(2026, 7, 19, tzinfo=timezone.utc),
        lambda i: ("Ganador P101", "Ganador P102"),
    )
    return partidos


def main() -> None:
    partidos = generar()
    assert len(partidos) == 104, f"Se esperaban 104 partidos, hay {len(partidos)}"
    destino = Path(__file__).resolve().parent.parent / "app" / "db" / "seed" / "partidos_2026.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        json.dumps(partidos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Generados {len(partidos)} partidos en {destino}")


if __name__ == "__main__":
    main()
