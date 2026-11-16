from sqlalchemy.orm import Session

from app.db import transaction
from app.enums import OrderStatus
from app.i18n import t
from app.models import Order, Shop
from app.repositories.orders import OrderRepository
from app.repositories.products import ProductRepository
from app.schemas import OrderIn
from app.services.stock import StockService
from app.validation import ValidationFailed


class OrderService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.orders = OrderRepository(db)
        self.products = ProductRepository(db)
        self.stock = StockService(db)

    def create(self, shop: Shop, data: OrderIn) -> Order:
        """Customer creates an order. Stock is decremented in the same transaction;
        any failure rolls the whole order back."""
        quantities: dict[int, int] = {}
        for line in data.items:
            quantities[line.product_id] = quantities.get(line.product_id, 0) + line.quantity

        products = self.products.active_by_ids(shop.id, list(quantities))
        if len(products) != len(quantities):
            raise ValidationFailed.single("items", t("One or more products are unavailable."))

        if data.fulfillment == "delivery" and not data.address:
            raise ValidationFailed.single("address", t("Address is required for delivery."))

        with transaction(self.db):
            lines = [
                {
                    "product_id": products[pid].id,
                    "name": products[pid].name,
                    "unit_price_cents": products[pid].price_cents,
                    "quantity": qty,
                }
                for pid, qty in quantities.items()
            ]
            total = sum(products[pid].price_cents * qty for pid, qty in quantities.items())

            order = self.orders.create(
                {
                    "shop_id": shop.id,
                    "customer_name": data.customer_name,
                    "customer_phone": data.customer_phone,
                    "fulfillment": data.fulfillment,
                    "address": data.address if data.fulfillment == "delivery" else None,
                    "notes": data.notes,
                    "status": OrderStatus.PENDING,
                    "total_cents": total,
                },
                lines,
            )

            for pid, qty in quantities.items():
                try:
                    self.stock.adjust(products[pid], -qty, f"order #{order.id}")
                except ValidationFailed:
                    raise ValidationFailed.single(
                        "items", t("Insufficient stock for :name.", name=products[pid].name)
                    ) from None

            return order

    def list(self, shop_id: int, status: OrderStatus | None) -> list[Order]:
        return self.orders.list_for_shop(shop_id, status)

    def find(self, shop_id: int, order_id: int) -> Order:
        return self.orders.find_for_shop(shop_id, order_id)

    def change_status(self, shop_id: int, order_id: int, target: OrderStatus) -> Order:
        """Moves the order along its state machine; cancelling returns the stock."""
        with transaction(self.db):
            order = self.orders.find_for_shop(shop_id, order_id)

            if not order.status.can_become(target):
                raise ValidationFailed.single(
                    "status",
                    t(
                        "Cannot change from :from to :to.",
                        **{"from": order.status.label(), "to": target.label()},
                    ),
                )

            if target is OrderStatus.CANCELLED:
                for item in order.items:
                    if item.product is not None:
                        self.stock.adjust(item.product, item.quantity, f"order #{order.id} cancelled")

            return self.orders.set_status(order, target)
