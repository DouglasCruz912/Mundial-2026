from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Participacion(Base):
    __tablename__ = "participaciones"
    __table_args__ = (UniqueConstraint("usuario_id", "quiniela_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))
    quiniela_id: Mapped[int] = mapped_column(ForeignKey("quinielas.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
