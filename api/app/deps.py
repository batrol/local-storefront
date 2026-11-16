import time
from collections import defaultdict, deque
from collections.abc import Callable, Iterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from app import security
from app.config import Settings
from app.errors import TooManyAttempts, Unauthenticated
from app.models import AccessToken, User


def get_settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def get_db(request: Request) -> Iterator[Session]:
    with request.app.state.session_factory() as db:
        yield db


DbDep = Annotated[Session, Depends(get_db)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


def current_token(request: Request, db: DbDep) -> AccessToken:
    header = request.headers.get("authorization", "")
    scheme, _, plain = header.partition(" ")
    if scheme.lower() != "bearer" or not plain:
        raise Unauthenticated
    token = security.find_token(db, plain.strip())
    if token is None:
        raise Unauthenticated
    return token


TokenDep = Annotated[AccessToken, Depends(current_token)]


def current_user(token: TokenDep) -> User:
    return token.user


UserDep = Annotated[User, Depends(current_user)]


def shop_id(user: UserDep) -> int:
    if user.shop is None:
        raise Unauthenticated
    return user.shop.id


ShopIdDep = Annotated[int, Depends(shop_id)]


def rate_limit(limit_of: Callable[[Settings], int], window_seconds: int = 60) -> Callable[[Request], None]:
    """Allow `limit` calls per client in a sliding window (in memory, per process)."""

    def check(request: Request) -> None:
        hits: dict[str, deque[float]] = request.app.state.rate_hits
        key = f"{request.url.path}:{request.client.host if request.client else '-'}"
        now = time.monotonic()
        window = hits[key]
        while window and now - window[0] > window_seconds:
            window.popleft()
        if len(window) >= limit_of(request.app.state.settings):
            raise TooManyAttempts
        window.append(now)

    return check


def new_rate_hits() -> dict[str, deque[float]]:
    return defaultdict(deque)
