"""Request bodies. Limits mirror what the API has always accepted."""

from typing import Annotated, Literal
from urllib.parse import urlparse

from email_validator import EmailNotValidError, validate_email
from pydantic import AfterValidator, Field
from pydantic_core import PydanticCustomError

from app.validation import RequestModel


def _email(value: str) -> str:
    try:
        validate_email(value, check_deliverability=False)
    except EmailNotValidError:
        raise PydanticCustomError("email", "invalid email") from None
    return value


def _max_190(value: str) -> str:
    if len(value) > 190:
        raise PydanticCustomError("string_too_long", "too long", {"max_length": 190})
    return value


def _url(value: str) -> str:
    parts = urlparse(value)
    if parts.scheme not in ("http", "https") or not parts.netloc:
        raise PydanticCustomError("url", "invalid url")
    return value


def _not_zero(value: int) -> int:
    if value == 0:
        raise PydanticCustomError("not_in", "must not be zero")
    return value


def _delta_range(value: int) -> int:
    if not -1_000_000 <= value <= 1_000_000:
        raise PydanticCustomError("between", "out of range", {"min": -1_000_000, "max": 1_000_000})
    return value


Email = Annotated[str, AfterValidator(_email)]
Url = Annotated[str, Field(max_length=500), AfterValidator(_url)]


class RegisterIn(RequestModel):
    name: str = Field(max_length=120)
    email: Annotated[Email, AfterValidator(_max_190)]
    password: str = Field(min_length=8)
    shop_name: str = Field(max_length=120)
    phone: str | None = Field(None, max_length=30)


class LoginIn(RequestModel):
    email: Email
    password: str


class CategoryIn(RequestModel):
    name: str = Field(max_length=80)


class ProductIn(RequestModel):
    name: str = Field(max_length=160)
    description: str | None = Field(None, max_length=2000)
    price_cents: int = Field(ge=0, le=100_000_000)
    category_id: int | None = None
    stock: int | None = Field(None, ge=0, le=1_000_000)
    low_stock_threshold: int = Field(5, ge=0, le=1_000_000)
    active: bool = True
    image_url: Url | None = None


class ProductPatch(RequestModel):
    """Update body: every field is optional, but when present it must be valid (not null)."""

    name: str = Field(None, max_length=160)  # type: ignore[assignment]
    description: str | None = Field(None, max_length=2000)
    price_cents: int = Field(None, ge=0, le=100_000_000)  # type: ignore[assignment]
    category_id: int | None = None
    stock: int | None = Field(None, ge=0, le=1_000_000)
    low_stock_threshold: int = Field(None, ge=0, le=1_000_000)  # type: ignore[assignment]
    active: bool = None  # type: ignore[assignment]
    image_url: Url | None = None


class StockAdjustIn(RequestModel):
    delta: Annotated[int, AfterValidator(_not_zero), AfterValidator(_delta_range)]
    reason: str = Field(max_length=120)


class OrderItemIn(RequestModel):
    product_id: int
    quantity: int = Field(ge=1, le=1000)


class OrderIn(RequestModel):
    customer_name: str = Field(max_length=120)
    customer_phone: str = Field(max_length=30)
    fulfillment: Literal["pickup", "delivery"]
    address: str | None = Field(None, max_length=255)
    notes: str | None = Field(None, max_length=1000)
    items: list[OrderItemIn] = Field(min_length=1, max_length=50)


class OrderStatusIn(RequestModel):
    status: Literal["pending", "confirmed", "ready", "completed", "cancelled"]
