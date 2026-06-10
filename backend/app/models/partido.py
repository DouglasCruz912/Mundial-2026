from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Partido(Base):
    __tablename__ = "partidos"
    __table_args__ = (
        CheckConstraint(
            "(goles_local IS NULL AND goles_visitante IS NULL) "
            "OR (goles_local IS NOT NULL AND goles_visitante IS NOT NULL)",
            name="resultado_completo",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    numero: Mapped[int] = mapped_column(unique=True)  # nº oficial FIFA, clave del seed
    equipo_local: Mapped[str] = mapped_column(String(60))
    equipo_visitante: Mapped[str] = mapped_column(String(60))
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    fase: Mapped[str] = mapped_column(String(20))
    grupo: Mapped[str | None] = mapped_column(String(1))
    goles_local: Mapped[int | None]
    goles_visitante: Mapped[int | None]
