from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuinielaCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nombre: str = Field(min_length=3, max_length=80)
    descripcion: str | None = Field(default=None, max_length=255)


class QuinielaJoin(BaseModel):
    model_config = ConfigDict(extra="forbid")

    codigo: str = Field(pattern=r"^MUND-[A-Z0-9]{4}$")


class QuinielaPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    descripcion: str | None
    codigo_invitacion: str
    creador_id: int
    created_at: datetime


class QuinielaResumen(QuinielaPublic):
    """Item del dashboard: quiniela + datos del usuario en ella."""

    participantes: int
    mis_puntos: int
