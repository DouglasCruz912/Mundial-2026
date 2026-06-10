from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UsuarioCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    nombre: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=8, max_length=128)


class UsuarioPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    nombre: str
    rol: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
