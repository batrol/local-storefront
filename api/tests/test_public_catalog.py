def test_shop_is_public_by_slug(client, world):
    shop = world.shop(slug="loja-x")

    response = client.get("/api/shops/loja-x")

    assert response.status_code == 200
    assert response.json()["data"]["id"] == shop.id
    assert client.get("/api/shops/nao-existe").status_code == 404


def test_catalog_lists_only_active_products_of_that_shop_without_exact_stock(client, world):
    shop = world.shop(slug="loja-x")
    other = world.shop()
    world.product(shop, name="Visible", stock=3)
    world.product(shop, name="Hidden", active=False)
    world.product(shop, name="Sold out", stock=0)
    world.product(other, name="Other shop")

    response = client.get("/api/shops/loja-x/products")

    assert response.status_code == 200
    data = response.json()["data"]
    assert [p["name"] for p in data] == ["Sold out", "Visible"]
    assert all("stock" not in p for p in data)
    assert {p["name"]: p["in_stock"] for p in data} == {"Visible": True, "Sold out": False}
