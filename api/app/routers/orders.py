from typing import Any

from fastapi import APIRouter

from app import resources
from app.deps import DbDep, ShopIdDep
from app.enums import OrderStatus
from app.schemas import OrderStatusIn
from app.services.orders import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("")
def index(db: DbDep, shop_id: ShopIdDep, status: str | None = None) -> dict[str, Any]:
    try:
        wanted = OrderStatus(status) if status else None
    except ValueError:
        wanted = None  # an unknown status filter is ignored
    return {"data": [resources.order(o) for o in OrderService(db).list(shop_id, wanted)]}


@router.get("/{order_id}")
def show(order_id: int, db: DbDep, shop_id: ShopIdDep) -> dict[str, Any]:
    return {"data": resources.order(OrderService(db).find(shop_id, order_id))}


@router.patch("/{order_id}/status")
def update_status(order_id: int, payload: OrderStatusIn, db: DbDep, shop_id: ShopIdDep) -> dict[str, Any]:
    order = OrderService(db).change_status(shop_id, order_id, OrderStatus(payload.status))
    return {"data": resources.order(order)}
