from sqlalchemy import select
from sqlalchemy.orm import Session

from app.errors import NotFound
from app.models import Category


class CategoryRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_for_shop(self, shop_id: int) -> list[Category]:
        return list(
            self.db.scalars(select(Category).where(Category.shop_id == shop_id).order_by(Category.name))
        )

    def find_for_shop(self, shop_id: int, category_id: int) -> Category:
        category = self.db.scalars(
            select(Category).where(Category.shop_id == shop_id, Category.id == category_id)
        ).first()
        if category is None:
            raise NotFound
        return category

    def create(self, shop_id: int, name: str) -> Category:
        category = Category(shop_id=shop_id, name=name)
        self.db.add(category)
        self.db.flush()
        return category

    def update(self, category: Category, name: str) -> Category:
        category.name = name
        self.db.flush()
        return category

    def delete(self, category: Category) -> None:
        self.db.delete(category)
        self.db.flush()

    def exists_for_shop(self, shop_id: int, category_id: int) -> bool:
        return (
            self.db.scalars(
                select(Category.id).where(Category.shop_id == shop_id, Category.id == category_id)
            ).first()
            is not None
        )
