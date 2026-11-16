from sqlalchemy import select

from app.models import Order, OrderItem, Product, StockMovement
from tests.conftest import errors_of


def body(items, **over):
    return {
        "customer_name": "Joao",
        "customer_phone": "11988887777",
        "fulfillment": "pickup",
        "items": items,
        **over,
    }


def movements(world, product_id):
    with world.factory() as db:
        return list(db.scalars(select(StockMovement).where(StockMovement.product_id == product_id)))


def test_customer_creates_order_and_stock_drops(client, world):
    shop = world.shop(slug="loja-x")
    product = world.product(shop, price_cents=2500, stock=10)

    response = client.post(
        "/api/shops/loja-x/orders",
        json=body([{"product_id": product.id, "quantity": 2}, {"product_id": product.id, "quantity": 1}]),
    )

    assert response.status_code == 201
    data = response.json()["data"]
    assert data["status"] == "pending"
    assert data["total_cents"] == 7500
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 3
    assert data["created_at"].endswith("+00:00")
    assert world.fresh(Product, product.id).stock == 7
    assert [m.delta for m in movements(world, product.id)] == [-3]


def test_insufficient_stock_rejects_and_rolls_back_everything(client, world):
    shop = world.shop(slug="loja-x")
    a = world.product(shop, stock=5)
    b = world.product(shop, stock=1, name="Last one")

    response = client.post(
        "/api/shops/loja-x/orders",
        json=body([{"product_id": a.id, "quantity": 2}, {"product_id": b.id, "quantity": 2}]),
    )

    assert errors_of(response)["items"] == ["Insufficient stock for Last one."]
    assert world.fresh(Product, a.id).stock == 5
    assert world.fresh(Product, b.id).stock == 1
    assert world.count(Order) == 0
    assert world.count(OrderItem) == 0
    assert movements(world, a.id) == []


def test_cannot_order_inactive_or_foreign_products(client, world):
    shop = world.shop(slug="loja-x")
    inactive = world.product(shop, active=False)
    foreign = world.product()

    for product in (inactive, foreign):
        response = client.post(
            "/api/shops/loja-x/orders", json=body([{"product_id": product.id, "quantity": 1}])
        )
        assert "items" in errors_of(response)


def test_delivery_requires_address_and_validation_applies(client, world):
    shop = world.shop(slug="loja-x")
    product = world.product(shop)
    item = [{"product_id": product.id, "quantity": 1}]

    assert "address" in errors_of(
        client.post("/api/shops/loja-x/orders", json=body(item, fulfillment="delivery"))
    )
    assert errors_of(client.post("/api/shops/loja-x/orders", json={"items": []})).keys() >= {
        "customer_name",
        "customer_phone",
        "fulfillment",
        "items",
    }
    assert client.post("/api/shops/nao-existe/orders", json=body(item)).status_code == 404


def test_delivery_order_keeps_address_and_pickup_drops_it(client, world):
    shop = world.shop(slug="loja-x")
    product = world.product(shop, stock=10)
    item = [{"product_id": product.id, "quantity": 1}]

    delivery = client.post(
        "/api/shops/loja-x/orders", json=body(item, fulfillment="delivery", address="Rua A, 10")
    )
    pickup = client.post("/api/shops/loja-x/orders", json=body(item, address="Rua A, 10"))

    assert delivery.json()["data"]["address"] == "Rua A, 10"
    assert pickup.json()["data"]["address"] is None


def test_item_quantity_is_validated(client, world):
    shop = world.shop(slug="loja-x")
    product = world.product(shop)

    response = client.post("/api/shops/loja-x/orders", json=body([{"product_id": product.id, "quantity": 0}]))

    assert errors_of(response)["items.0.quantity"] == ["The items.0.quantity field must be at least 1."]


def test_order_endpoint_is_rate_limited(client, app, world):
    app.state.settings.order_rate_limit = 2
    world.shop(slug="loja-x")

    statuses = [client.post("/api/shops/loja-x/orders", json={}).status_code for _ in range(3)]

    assert statuses == [422, 422, 429]


def test_merchant_lists_filters_and_reads_only_own_orders(client, world):
    user, shop = world.merchant()
    world.order(shop)
    world.order(shop)
    world.order(shop, status="completed")
    foreign = world.order()
    h = world.headers(user)

    assert len(client.get("/api/orders", headers=h).json()["data"]) == 3
    assert len(client.get("/api/orders?status=completed", headers=h).json()["data"]) == 1
    assert len(client.get("/api/orders?status=bogus", headers=h).json()["data"]) == 3
    assert client.get(f"/api/orders/{foreign.id}", headers=h).status_code == 404


def test_orders_require_authentication(client):
    assert client.get("/api/orders").status_code == 401


def test_status_flow_and_invalid_transitions(client, world):
    user, shop = world.merchant()
    order = world.order(shop)
    h = world.headers(user)

    for status in ["confirmed", "ready", "completed"]:
        response = client.patch(f"/api/orders/{order.id}/status", json={"status": status}, headers=h)
        assert response.status_code == 200
        assert response.json()["data"]["status"] == status

    assert "status" in errors_of(
        client.patch(f"/api/orders/{order.id}/status", json={"status": "cancelled"}, headers=h)
    )

    pending = world.order(shop)
    skipped = client.patch(f"/api/orders/{pending.id}/status", json={"status": "completed"}, headers=h)
    assert errors_of(skipped)["status"] == ["Cannot change from new to completed."]
    assert (
        client.patch(f"/api/orders/{pending.id}/status", json={"status": "bogus"}, headers=h).status_code
        == 422
    )


def test_transition_message_is_translated(client, world):
    user, shop = world.merchant()
    pending = world.order(shop)
    headers = {**world.headers(user), "Accept-Language": "pt-BR"}

    response = client.patch(f"/api/orders/{pending.id}/status", json={"status": "completed"}, headers=headers)

    assert errors_of(response)["status"] == ["Não é possível mudar de novo para concluído."]


def test_cancelling_returns_stock(client, world):
    user, shop = world.merchant(slug="loja-x")
    product = world.product(shop, stock=10)

    created = client.post("/api/shops/loja-x/orders", json=body([{"product_id": product.id, "quantity": 4}]))
    order_id = created.json()["data"]["id"]
    assert world.fresh(Product, product.id).stock == 6

    cancelled = client.patch(
        f"/api/orders/{order_id}/status", json={"status": "cancelled"}, headers=world.headers(user)
    )

    assert cancelled.status_code == 200
    assert world.fresh(Product, product.id).stock == 10
    assert [m.delta for m in movements(world, product.id)] == [-4, 4]


def test_cannot_change_status_of_another_shops_order(client, world):
    user, _ = world.merchant()
    foreign = world.order()

    response = client.patch(
        f"/api/orders/{foreign.id}/status", json={"status": "confirmed"}, headers=world.headers(user)
    )

    assert response.status_code == 404
