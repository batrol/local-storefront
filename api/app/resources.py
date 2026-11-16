"""JSON shapes returned to clients."""

from datetime import UTC, datetime
from typing import Any

from app.models import Category, Order, Product, Shop, User


def _iso(value: datetime | None) -> str | None:
    return value.replace(tzinfo=UTC).isoformat() if value else None


def category(c: Category | None) -> dict[str, Any] | None:
    return {"id": c.id, "name": c.name} if c else None


def shop(s: Shop | None) -> dict[str, Any] | None:
    return {"id": s.id, "name": s.name, "slug": s.slug, "phone": s.phone} if s else None


def user(u: User) -> dict[str, Any]:
    return {"id": u.id, "name": u.name, "email": u.email, "shop": shop(u.shop)}


def product(p: Product) -> dict[str, Any]:
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "price_cents": p.price_cents,
        "stock": p.stock,
        "low_stock_threshold": p.low_stock_threshold,
        "low_stock": p.is_low_stock,
        "active": p.active,
        "image_url": p.image_url,
        "category": category(p.category),
    }


def public_product(p: Product) -> dict[str, Any]:
    """What customers see: no exact stock, only whether it is available."""
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "price_cents": p.price_cents,
        "image_url": p.image_url,
        "in_stock": p.stock > 0,
        "category": category(p.category),
    }


def order(o: Order) -> dict[str, Any]:
    return {
        "id": o.id,
        "status": o.status.value,
        "customer_name": o.customer_name,
        "customer_phone": o.customer_phone,
        "fulfillment": o.fulfillment,
        "address": o.address,
        "notes": o.notes,
        "total_cents": o.total_cents,
        "created_at": _iso(o.created_at),
        "items": [
            {
                "product_id": i.product_id,
                "name": i.name,
                "unit_price_cents": i.unit_price_cents,
                "quantity": i.quantity,
            }
            for i in o.items
        ],
    }
