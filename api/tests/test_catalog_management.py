from sqlalchemy import select

from app.models import Category, Product, StockMovement
from tests.conftest import errors_of


def movements(world, product_id):
    with world.factory() as db:
        return list(db.scalars(select(StockMovement).where(StockMovement.product_id == product_id)))


def test_requires_authentication(client):
    assert client.get("/api/products").status_code == 401
    assert client.get("/api/categories").status_code == 401


def test_category_crud(client, world):
    user, _ = world.merchant()
    h = world.headers(user)

    created = client.post("/api/categories", json={"name": "Cabos"}, headers=h)
    assert created.status_code == 201
    cid = created.json()["data"]["id"]

    updated = client.put(f"/api/categories/{cid}", json={"name": "Cabos USB"}, headers=h)
    assert updated.status_code == 200
    assert updated.json()["data"]["name"] == "Cabos USB"
    assert len(client.get("/api/categories", headers=h).json()["data"]) == 1

    assert client.delete(f"/api/categories/{cid}", headers=h).status_code == 204
    assert world.fresh(Category, cid) is None


def test_product_crud_with_initial_stock_logged(client, world):
    user, shop = world.merchant()
    category = world.category(shop)
    h = world.headers(user)

    created = client.post(
        "/api/products",
        json={"name": "Cabo USB-C", "price_cents": 1990, "stock": 12, "category_id": category.id},
        headers=h,
    )
    assert created.status_code == 201
    data = created.json()["data"]
    assert data["stock"] == 12
    assert data["category"]["id"] == category.id
    assert data["low_stock_threshold"] == 5
    assert data["active"] is True

    [movement] = movements(world, data["id"])
    assert (movement.delta, movement.balance, movement.reason) == (12, 12, "initial stock")

    updated = client.put(
        f"/api/products/{data['id']}", json={"name": "Cabo USB-C 2m", "stock": 999}, headers=h
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["name"] == "Cabo USB-C 2m"
    assert updated.json()["data"]["stock"] == 12  # stock cannot be edited here
    assert updated.json()["data"]["price_cents"] == 1990  # fields left out are untouched

    assert client.get(f"/api/products/{data['id']}", headers=h).status_code == 200
    assert client.delete(f"/api/products/{data['id']}", headers=h).status_code == 204
    assert world.fresh(Product, data["id"]) is None


def test_product_can_be_moved_out_of_a_category(client, world):
    user, shop = world.merchant()
    product = world.product(shop, category_id=world.category(shop).id)

    response = client.put(
        f"/api/products/{product.id}", json={"category_id": None}, headers=world.headers(user)
    )

    assert response.status_code == 200
    assert response.json()["data"]["category"] is None


def test_product_validation(client, world):
    user, _ = world.merchant()
    h = world.headers(user)

    assert "price_cents" in errors_of(
        client.post("/api/products", json={"name": "X", "price_cents": -1}, headers=h)
    )
    assert errors_of(client.post("/api/products", json={}, headers=h)).keys() >= {"name", "price_cents"}
    bad_url = client.post(
        "/api/products", json={"name": "X", "price_cents": 1, "image_url": "nope"}, headers=h
    )
    assert errors_of(bad_url)["image_url"] == ["The image url field must be a valid URL."]


def test_cannot_use_another_shops_category_or_products(client, world):
    user_a, _ = world.merchant()
    _, shop_b = world.merchant()
    category_b = world.category(shop_b)
    product_b = world.product(shop_b)
    h = world.headers(user_a)

    forged = client.post(
        "/api/products", json={"name": "X", "price_cents": 100, "category_id": category_b.id}, headers=h
    )
    assert "category_id" in errors_of(forged)

    assert client.get(f"/api/products/{product_b.id}", headers=h).status_code == 404
    assert client.put(f"/api/products/{product_b.id}", json={"name": "hack"}, headers=h).status_code == 404
    assert client.delete(f"/api/products/{product_b.id}", headers=h).status_code == 404
    assert client.put(f"/api/categories/{category_b.id}", json={"name": "hack"}, headers=h).status_code == 404
    stock = client.post(f"/api/products/{product_b.id}/stock", json={"delta": 5, "reason": "x"}, headers=h)
    assert stock.status_code == 404
    assert client.get("/api/products", headers=h).json()["data"] == []


def test_unknown_or_malformed_ids_are_404(client, world):
    user, _ = world.merchant()
    h = world.headers(user)

    assert client.get("/api/products/999", headers=h).status_code == 404
    assert client.get("/api/products/abc", headers=h).status_code == 404


def test_stock_adjustment_logs_movement_and_flags_low_stock(client, world):
    user, shop = world.merchant()
    product = world.product(shop, stock=10, low_stock_threshold=5)

    response = client.post(
        f"/api/products/{product.id}/stock",
        json={"delta": -6, "reason": "sold at counter"},
        headers=world.headers(user),
    )

    assert response.status_code == 200
    assert response.json()["data"]["stock"] == 4
    assert response.json()["data"]["low_stock"] is True
    [movement] = movements(world, product.id)
    assert (movement.delta, movement.balance, movement.reason) == (-6, 4, "sold at counter")


def test_stock_cannot_go_negative(client, world):
    user, shop = world.merchant()
    product = world.product(shop, stock=2)

    response = client.post(
        f"/api/products/{product.id}/stock", json={"delta": -3, "reason": "x"}, headers=world.headers(user)
    )

    assert errors_of(response)["delta"] == ["Insufficient stock."]
    assert world.fresh(Product, product.id).stock == 2
    assert movements(world, product.id) == []


def test_stock_adjustment_requires_nonzero_delta_and_reason(client, world):
    user, shop = world.merchant()
    product = world.product(shop)
    h = world.headers(user)

    errors = errors_of(client.post(f"/api/products/{product.id}/stock", json={"delta": 0}, headers=h))
    assert errors.keys() >= {"delta", "reason"}

    too_big = client.post(
        f"/api/products/{product.id}/stock", json={"delta": 2_000_000, "reason": "x"}, headers=h
    )
    assert "delta" in errors_of(too_big)
