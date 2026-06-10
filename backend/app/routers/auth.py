from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from sqlalchemy import select

from app.config import get_settings
from app.core.rate_limit import limiter
from app.core.security import (
    CurrentUser,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.db.session import SessionDep
from app.models.usuario import Usuario
from app.schemas.usuario import Token, UsuarioCreate, UsuarioPublic
from app.services import usuario_service

router = APIRouter(prefix="/api/v1", tags=["auth"])

REFRESH_COOKIE = "refresh_token"
REFRESH_PATH = "/api/v1/token/refresh"


def _set_refresh_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.environment != "development",
        path=REFRESH_PATH,
        max_age=settings.refresh_token_expire_days * 24 * 3600,
    )


@router.post("/auth/register", response_model=UsuarioPublic, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(request: Request, datos: UsuarioCreate, session: SessionDep) -> Usuario:
    existente = await usuario_service.obtener_por_email(session, datos.email)
    if existente is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email ya registrado")
    return await usuario_service.crear(session, datos)


@router.post("/token", response_model=Token)
@limiter.limit("10/minute")
async def login(
    request: Request,
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep,
) -> Token:
    usuario = await usuario_service.autenticar(session, form_data.username, form_data.password)
    if usuario is None or not usuario.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    _set_refresh_cookie(response, create_refresh_token(usuario))
    return Token(access_token=create_access_token(usuario))


@router.post("/token/refresh", response_model=Token)
async def refresh(
    session: SessionDep,
    refresh_token: Annotated[str | None, Cookie(alias=REFRESH_COOKIE)] = None,
) -> Token:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    if refresh_token is None:
        raise credentials_exception
    try:
        payload = decode_token(refresh_token, expected_type="refresh")
    except InvalidTokenError:
        raise credentials_exception
    usuario = (
        await session.execute(select(Usuario).where(Usuario.id == int(payload["sub"])))
    ).scalar_one_or_none()
    if usuario is None or not usuario.is_active:
        raise credentials_exception
    return Token(access_token=create_access_token(usuario))


@router.post("/token/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE, path=REFRESH_PATH)


@router.get("/usuarios/me", response_model=UsuarioPublic)
async def me(current_user: CurrentUser) -> Usuario:
    return current_user
