from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Quiniela(Base):
    __tablename__ = "quinielas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80))
    descripcion: Mapped[str | None] = mapped_column(String(255))
    codigo_invitacion: Mapped[str] = mapped_column(String(9), unique=True, index=True)
    creador_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
