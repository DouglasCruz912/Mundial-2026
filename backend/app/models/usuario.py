from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (CheckConstraint("rol IN ('user', 'admin')", name="rol_valido"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    nombre: Mapped[str] = mapped_column(String(50))
    hashed_password: Mapped[str]
    rol: Mapped[str] = mapped_column(String(10), default="user")
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
