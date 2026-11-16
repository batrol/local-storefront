from sqlalchemy.orm import Session

from app.errors import NotFound
from app.models import Product, Shop
from app.repositories.products import ProductRepository
from app.repositories.shops import ShopRepository


class PublicShopService:
    def __init__(self, db: Session) -> None:
        self.shops = ShopRepository(db)
        self.products = ProductRepository(db)

    def shop(self, slug: str) -> Shop:
        shop = self.shops.find_by_slug(slug)
        if shop is None:
            raise NotFound
        return shop

    def catalog(self, shop: Shop) -> list[Product]:
        return self.products.list_for_shop(shop.id, only_active=True)
