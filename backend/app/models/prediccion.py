from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Prediccion(Base):
    __tablename__ = "predicciones"
    __table_args__ = (
        UniqueConstraint("participacion_id", "partido_id"),
        CheckConstraint(
            "goles_local BETWEEN 0 AND 20 AND goles_visitante BETWEEN 0 AND 20",
            name="goles_rango",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    participacion_id: Mapped[int] = mapped_column(ForeignKey("participaciones.id"))
    partido_id: Mapped[int] = mapped_column(ForeignKey("partidos.id"), index=True)
    goles_local: Mapped[int]
    goles_visitante: Mapped[int]
    puntos: Mapped[int | None]  # null = sin evaluar; 0/1/3 tras evaluación
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
