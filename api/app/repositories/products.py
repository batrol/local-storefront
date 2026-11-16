from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.errors import NotFound
from app.models import Product


class ProductRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_shop(self, shop_id: int, only_active: bool = False) -> list[Product]:
        query = (
            select(Product)
            .options(joinedload(Product.category))
            .where(Product.shop_id == shop_id)
            .order_by(Product.name)
        )
        if only_active:
            query = query.where(Product.active.is_(True))
        return list(self.db.scalars(query))

    def find_for_shop(self, shop_id: int, product_id: int) -> Product:
        product = self.db.scalars(
            select(Product)
            .options(joinedload(Product.category))
            .where(Product.shop_id == shop_id, Product.id == product_id)
        ).first()
        if product is None:
            raise NotFound
        return product

    def create(self, shop_id: int, data: dict[str, Any]) -> Product:
        product = Product(**data, shop_id=shop_id)
        self.db.add(product)
        self.db.flush()
        self.db.refresh(product, ["category"])
        return product

    def update(self, product: Product, data: dict[str, Any]) -> Product:
        for field, value in data.items():
            setattr(product, field, value)
        self.db.flush()
        self.db.refresh(product, ["category"])
        return product

    def active_by_ids(self, shop_id: int, ids: list[int]) -> dict[int, Product]:
        rows = self.db.scalars(
            select(Product).where(Product.shop_id == shop_id, Product.active.is_(True), Product.id.in_(ids))
        )
        return {product.id: product for product in rows}

    def delete(self, product: Product) -> None:
        self.db.delete(product)
        self.db.flush()
