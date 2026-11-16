from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Shop, User


class ShopRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_for(self, user: User, name: str, phone: str | None, slug: str) -> Shop:
        shop = Shop(user_id=user.id, name=name, phone=phone, slug=slug)
        self.db.add(shop)
        self.db.flush()
        user.shop = shop
        return shop

    def slug_exists(self, slug: str) -> bool:
        return self.db.scalars(select(Shop.id).where(Shop.slug == slug)).first() is not None

    def find_by_slug(self, slug: str) -> Shop | None:
        return self.db.scalars(select(Shop).where(Shop.slug == slug)).first()
