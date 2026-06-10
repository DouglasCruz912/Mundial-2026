from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PrediccionUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid")

    partido_id: int
    goles_local: int = Field(ge=0, le=20)
    goles_visitante: int = Field(ge=0, le=20)


class PrediccionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    partido_id: int
    goles_local: int
    goles_visitante: int
    puntos: int | None
    updated_at: datetime
