from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy import select

from app.config import get_settings
from app.db.session import SessionDep
from app.models.usuario import Usuario

password_hash = PasswordHash.recommended()  # Argon2

SCOPES = {
    "me": "Leer datos propios",
    "quinielas:read": "Ver quinielas y predicciones propias",
    "quinielas:write": "Crear/unirse a quinielas y predecir",
    "admin": "Administración (cargar resultados)",
}

USER_SCOPES = ["me", "quinielas:read", "quinielas:write"]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/token", scopes=SCOPES)

# Hash dummy para igualar el tiempo de verify cuando el usuario no existe
_DUMMY_HASH = password_hash.hash("dummy-password-for-timing")


def verify_password(plain: str, hashed: str) -> bool:
    return password_hash.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def _create_token(data: dict, expires_delta: timedelta) -> str:
    settings = get_settings()
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(usuario: Usuario) -> str:
    settings = get_settings()
    scopes = USER_SCOPES + (["admin"] if usuario.rol == "admin" else [])
    return _create_token(
        {"sub": str(usuario.id), "scope": " ".join(scopes), "type": "access"},
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_refresh_token(usuario: Usuario) -> str:
    settings = get_settings()
    return _create_token(
        {"sub": str(usuario.id), "type": "refresh"},
        timedelta(days=settings.refresh_token_expire_days),
    )


def decode_token(token: str, expected_type: str) -> dict:
    settings = get_settings()
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    if payload.get("type") != expected_type:
        raise InvalidTokenError("Tipo de token incorrecto")
    return payload


async def get_current_user(
    security_scopes: SecurityScopes,
    token: Annotated[str, Depends(oauth2_scheme)],
    session: SessionDep,
) -> Usuario:
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": authenticate_value},
    )
    try:
        payload = decode_token(token, expected_type="access")
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_scopes = payload.get("scope", "").split()
    except InvalidTokenError:
        raise credentials_exception

    for scope in security_scopes.scopes:
        if scope not in token_scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
                headers={"WWW-Authenticate": authenticate_value},
            )

    usuario = (
        await session.execute(select(Usuario).where(Usuario.id == int(user_id)))
    ).scalar_one_or_none()
    if usuario is None:
        raise credentials_exception
    return usuario


async def get_current_active_user(
    current_user: Annotated[Usuario, Security(get_current_user, scopes=["me"])],
) -> Usuario:
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    return current_user


CurrentUser = Annotated[Usuario, Depends(get_current_active_user)]
