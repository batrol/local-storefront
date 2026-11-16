from sqlalchemy.orm import Session

from app.db import transaction
from app.models import Category
from app.repositories.categories import CategoryRepository


class CategoryService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.categories = CategoryRepository(db)

    def list(self, shop_id: int) -> list[Category]:
        return self.categories.list_for_shop(shop_id)

    def create(self, shop_id: int, name: str) -> Category:
        with transaction(self.db):
            return self.categories.create(shop_id, name)

    def update(self, shop_id: int, category_id: int, name: str) -> Category:
        with transaction(self.db):
            return self.categories.update(self.categories.find_for_shop(shop_id, category_id), name)

    def delete(self, shop_id: int, category_id: int) -> None:
        with transaction(self.db):
            self.categories.delete(self.categories.find_for_shop(shop_id, category_id))
