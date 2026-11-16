"""API messages in English (default) and Brazilian Portuguese, chosen by Accept-Language."""

import json
from contextvars import ContextVar
from pathlib import Path
from typing import Any

from starlette.types import ASGIApp, Receive, Scope, Send

SUPPORTED = ("en", "pt_BR")
DEFAULT_LOCALE = "en"

_locale: ContextVar[str] = ContextVar("locale", default=DEFAULT_LOCALE)
_STRINGS: dict[str, dict[str, str]] = {
    "pt_BR": json.loads((Path(__file__).parent / "lang" / "pt_BR.json").read_text(encoding="utf-8")),
}


def get_locale() -> str:
    return _locale.get()


def t(key: str, **params: Any) -> str:
    """Translate a message whose key is its English text; `:name` placeholders are replaced."""
    text = _STRINGS.get(get_locale(), {}).get(key, key)
    for name, value in params.items():
        text = text.replace(f":{name}", str(value))
    return text


def negotiate_locale(header: str | None, default: str = DEFAULT_LOCALE) -> str:
    """Pick the best supported locale: exact match first (pt-BR), then language only (pt)."""
    if not header:
        return default
    ranked: list[tuple[float, int, str]] = []
    for index, part in enumerate(header.split(",")):
        tag, *params = (piece.strip() for piece in part.split(";"))
        quality = 1.0
        for param in params:
            if param.startswith("q="):
                try:
                    quality = float(param[2:])
                except ValueError:
                    quality = 0.0
        if tag and tag != "*" and quality > 0:
            ranked.append((-quality, index, tag.replace("-", "_").lower()))
    for _, _, tag in sorted(ranked):
        for supported in SUPPORTED:
            if tag == supported.lower():
                return supported
        language = tag.split("_")[0]
        for supported in SUPPORTED:
            if supported.lower().split("_")[0] == language:
                return supported
    return default


class LocaleMiddleware:
    def __init__(self, app: ASGIApp, default: str = DEFAULT_LOCALE) -> None:
        self.app = app
        self.default = default

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        header = next((v.decode() for k, v in scope["headers"] if k == b"accept-language"), None)
        token = _locale.set(negotiate_locale(header, self.default))
        try:
            await self.app(scope, receive, send)
        finally:
            _locale.reset(token)
