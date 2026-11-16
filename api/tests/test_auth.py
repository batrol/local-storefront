from typing import Any

from app.models import AccessToken, Shop
from tests.conftest import errors_of


def payload(**over: Any) -> dict[str, Any]:
    return {
        "name": "Maria Silva",
        "email": "maria@example.com",
        "password": "password123",
        "shop_name": "Loja da Maria",
        "phone": "11999990000",
        **over,
    }


def test_register_creates_user_shop_and_token(client, world):
    response = client.post("/api/auth/register", json=payload())

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["shop"]["slug"] == "loja-da-maria"
    assert set(body) == {"token", "user"}
    assert {"id", "email", "shop"} <= set(body["user"])
    assert {"id", "name", "slug"} <= set(body["user"]["shop"])
    assert world.count(Shop) == 1


def test_slug_is_unique_when_names_collide(client):
    assert client.post("/api/auth/register", json=payload()).status_code == 201

    response = client.post("/api/auth/register", json=payload(email="b@example.com"))

    assert response.status_code == 201
    assert response.json()["user"]["shop"]["slug"] == "loja-da-maria-2"


def test_slug_drops_accents_and_symbols(client):
    response = client.post("/api/auth/register", json=payload(shop_name="  Açaí & Cia! "))

    assert response.json()["user"]["shop"]["slug"] == "acai-cia"


def test_register_validates_input(client):
    errors = errors_of(
        client.post("/api/auth/register", json=payload(email="not-an-email", password="short"))
    )

    assert errors["email"] == ["The email field must be a valid email address."]
    assert errors["password"] == ["The password field must be at least 8 characters."]


def test_register_rejects_an_email_already_taken(client, world):
    world.user(email="maria@example.com")

    errors = errors_of(client.post("/api/auth/register", json=payload()))

    assert errors == {"email": ["The email has already been taken."]}


def test_validation_message_counts_the_other_errors(client):
    response = client.post("/api/auth/register", json={})

    assert response.status_code == 422
    assert response.json()["message"] == "The name field is required. (and 3 more errors)"


def test_login_and_me(client, world):
    user, shop = world.merchant()

    login = client.post("/api/auth/login", json={"email": user.email, "password": "password123"})
    assert login.status_code == 200

    me = client.get("/api/me", headers={"Authorization": f"Bearer {login.json()['token']}"})
    assert me.status_code == 200
    assert me.json()["data"]["email"] == user.email
    assert me.json()["data"]["shop"]["id"] == shop.id


def test_login_rejects_wrong_password(client, world):
    user = world.user()

    errors = errors_of(client.post("/api/auth/login", json={"email": user.email, "password": "nope"}))

    assert errors["email"] == ["Invalid credentials."]


def test_me_requires_authentication(client):
    response = client.get("/api/me")

    assert response.status_code == 401
    assert response.json() == {"message": "Unauthenticated."}


def test_invalid_token_is_rejected(client, world):
    user = world.user()
    token = world.token_for(user)
    tampered = token[:-1] + ("A" if token[-1] != "A" else "B")

    assert client.get("/api/me", headers={"Authorization": f"Bearer {tampered}"}).status_code == 401
    assert client.get("/api/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_messages_are_in_english_by_default(client):
    errors = errors_of(client.post("/api/auth/login", json={}))

    assert errors["email"][0] == "The email field is required."


def test_messages_follow_the_accept_language_header(client):
    for header in ["pt-BR", "pt-BR,pt;q=0.9,en;q=0.8", "pt"]:
        errors = errors_of(client.post("/api/auth/login", json={}, headers={"Accept-Language": header}))
        assert errors["email"][0] == "O campo e-mail é obrigatório."

    wrong = client.post(
        "/api/auth/login",
        json={"email": "x@example.com", "password": "wrong-password"},
        headers={"Accept-Language": "pt-BR"},
    )
    assert errors_of(wrong)["email"][0] == "Credenciais inválidas."

    french = client.post("/api/auth/login", json={}, headers={"Accept-Language": "fr"})
    assert errors_of(french)["email"][0] == "The email field is required."

    unauthenticated = client.get("/api/me", headers={"Accept-Language": "pt-BR"})
    assert unauthenticated.json() == {"message": "Não autenticado."}


def test_logout_revokes_token(client, world):
    user = world.user()
    headers = world.headers(user)
    assert world.count(AccessToken) == 1

    assert client.post("/api/auth/logout", headers=headers).status_code == 204

    assert world.count(AccessToken) == 0
    assert client.get("/api/me", headers=headers).status_code == 401
