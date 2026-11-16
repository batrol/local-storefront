from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.enums import OrderStatus
from app.errors import NotFound
from app.models import Order, OrderItem


class OrderRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_shop(self, shop_id: int, status: OrderStatus | None = None) -> list[Order]:
        query = select(Order).options(selectinload(Order.items)).where(Order.shop_id == shop_id)
        if status is not None:
            query = query.where(Order.status == status)
        return list(self.db.scalars(query.order_by(Order.id.desc())))

    def find_for_shop(self, shop_id: int, order_id: int) -> Order:
        order = self.db.scalars(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.shop_id == shop_id, Order.id == order_id)
        ).first()
        if order is None:
            raise NotFound
        return order

    def create(self, data: dict[str, Any], items: list[dict[str, Any]]) -> Order:
        order = Order(**data, items=[OrderItem(**item) for item in items])
        self.db.add(order)
        self.db.flush()
        return order

    def set_status(self, order: Order, status: OrderStatus) -> Order:
        order.status = status
        self.db.flush()
        return order
