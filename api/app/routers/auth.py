from typing import Any

from fastapi import APIRouter, Response

from app import resources
from app.deps import DbDep, SettingsDep, TokenDep, UserDep
from app.schemas import LoginIn, RegisterIn
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201)
def register(payload: RegisterIn, db: DbDep, settings: SettingsDep) -> dict[str, Any]:
    user, token = AuthService(db, settings).register(payload)
    return {"token": token, "user": resources.user(user)}


@router.post("/login")
def login(payload: LoginIn, db: DbDep, settings: SettingsDep) -> dict[str, Any]:
    user, token = AuthService(db, settings).login(payload.email, payload.password)
    return {"token": token, "user": resources.user(user)}


@router.post("/logout", status_code=204)
def logout(token: TokenDep, db: DbDep, settings: SettingsDep) -> Response:
    AuthService(db, settings).logout(token)
    return Response(status_code=204)


me_router = APIRouter(tags=["auth"])


@me_router.get("/me")
def me(user: UserDep) -> dict[str, Any]:
    return {"data": resources.user(user)}
