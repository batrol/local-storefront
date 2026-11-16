from collections.abc import Iterator
from itertools import count
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from app import security
from app.config import Settings
from app.db import Base
from app.main import create_app
from app.models import Category, Order, Product, Shop, User

_ids = count(1)


class World:
    """Builds database rows and reads them back, each call in its own short session."""

    def __init__(self, app: FastAPI) -> None:
        self.factory: sessionmaker[Session] = app.state.session_factory

    def _add(self, row: Any) -> Any:
        with self.factory() as db:
            db.add(row)
            db.commit()
        return row

    def user(self, password: str = "password123", **over: Any) -> User:
        n = next(_ids)
        data = {"name": f"User {n}", "email": f"user{n}@example.com", **over}
        return self._add(User(**data, password=security.hash_password(password, 4)))

    def shop(self, user: User | None = None, **over: Any) -> Shop:
        n = next(_ids)
        user = user or self.user()
        data = {"name": f"Shop {n}", "slug": f"shop-{n}", **over}
        return self._add(Shop(user_id=user.id, **data))

    def merchant(self, **shop_over: Any) -> tuple[User, Shop]:
        user = self.user()
        return user, self.shop(user, **shop_over)

    def category(self, shop: Shop | None = None, **over: Any) -> Category:
        n = next(_ids)
        shop = shop or self.shop()
        return self._add(Category(shop_id=shop.id, **{"name": f"Category {n}", **over}))

    def product(self, shop: Shop | None = None, **over: Any) -> Product:
        n = next(_ids)
        shop = shop or self.shop()
        data = {
            "name": f"Product {n}",
            "price_cents": 1000,
            "stock": 10,
            "low_stock_threshold": 5,
            "active": True,
            **over,
        }
        return self._add(Product(shop_id=shop.id, **data))

    def order(self, shop: Shop | None = None, **over: Any) -> Order:
        shop = shop or self.shop()
        data = {"customer_name": "Joao", "customer_phone": "11988887777", "total_cents": 1000, **over}
        return self._add(Order(shop_id=shop.id, **data))

    def token_for(self, user: User) -> str:
        with self.factory() as db:
            token = security.create_token(db, user)
            db.commit()
        return token

    def headers(self, user: User) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token_for(user)}"}

    def fresh(self, model: type[Any], row_id: int) -> Any:
        with self.factory() as db:
            return db.get(model, row_id)

    def count(self, model: type[Any]) -> int:
        with self.factory() as db:
            return db.scalar(select(func.count()).select_from(model)) or 0


@pytest.fixture
def app() -> Iterator[FastAPI]:
    application = create_app(
        Settings(database_url="sqlite://", bcrypt_rounds=4, app_locale="en", _env_file=None)
    )  # type: ignore[call-arg]
    Base.metadata.create_all(application.state.engine)
    yield application
    application.state.engine.dispose()


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    return TestClient(app)


@pytest.fixture
def world(app: FastAPI) -> World:
    return World(app)


def errors_of(response: Any) -> dict[str, list[str]]:
    assert response.status_code == 422, response.text
    errors: dict[str, list[str]] = response.json()["errors"]
    return errors
