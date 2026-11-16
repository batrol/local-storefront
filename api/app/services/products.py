from typing import Any

from sqlalchemy.orm import Session

from app.db import transaction
from app.i18n import t
from app.models import Product
from app.repositories.categories import CategoryRepository
from app.repositories.products import ProductRepository
from app.services.stock import StockService
from app.validation import ValidationFailed


class ProductService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.products = ProductRepository(db)
        self.categories = CategoryRepository(db)
        self.stock = StockService(db)

    def list(self, shop_id: int) -> list[Product]:
        return self.products.list_for_shop(shop_id)

    def find(self, shop_id: int, product_id: int) -> Product:
        return self.products.find_for_shop(shop_id, product_id)

    def create(self, shop_id: int, data: dict[str, Any]) -> Product:
        self._assert_category_belongs_to_shop(shop_id, data.get("category_id"))
        initial_stock = int(data.pop("stock", None) or 0)

        with transaction(self.db):
            product = self.products.create(shop_id, {**data, "stock": 0})
            if initial_stock > 0:
                product = self.stock.adjust(product, initial_stock, "initial stock")
            return product

    def update(self, shop_id: int, product_id: int, data: dict[str, Any]) -> Product:
        self._assert_category_belongs_to_shop(shop_id, data.get("category_id"))
        data.pop("stock", None)  # stock only changes through StockService

        with transaction(self.db):
            return self.products.update(self.products.find_for_shop(shop_id, product_id), data)

    def delete(self, shop_id: int, product_id: int) -> None:
        with transaction(self.db):
            self.products.delete(self.products.find_for_shop(shop_id, product_id))

    def _assert_category_belongs_to_shop(self, shop_id: int, category_id: int | None) -> None:
        if category_id is not None and not self.categories.exists_for_shop(shop_id, category_id):
            raise ValidationFailed.single("category_id", t("Invalid category."))
