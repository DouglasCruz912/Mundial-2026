from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResultadoUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    goles_local: int = Field(ge=0, le=20)
    goles_visitante: int = Field(ge=0, le=20)


class PartidoPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero: int
    equipo_local: str
    equipo_visitante: str
    fecha_hora: datetime
    fase: str
    grupo: str | None
    goles_local: int | None
    goles_visitante: int | None
