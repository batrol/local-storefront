from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db import transaction
from app.i18n import t
from app.models import Product, StockMovement
from app.validation import ValidationFailed


class StockService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def adjust(self, product: Product, delta: int, reason: str) -> Product:
        """Apply a stock change and log it. Stock never goes below zero.

        Re-reads the row under a lock so concurrent orders cannot oversell.
        """
        with transaction(self.db):
            locked = self.db.scalars(
                select(Product)
                .options(joinedload(Product.category))
                .where(Product.id == product.id)
                .with_for_update()
                .execution_options(populate_existing=True)
            ).one()
            balance = locked.stock + delta

            if balance < 0:
                raise ValidationFailed.single("delta", t("Insufficient stock."))

            locked.stock = balance
            self.db.add(StockMovement(product_id=locked.id, delta=delta, balance=balance, reason=reason))
            self.db.flush()
            return locked
