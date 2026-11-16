from typing import Any

from fastapi import APIRouter, Depends

from app import resources
from app.deps import DbDep, rate_limit
from app.schemas import OrderIn
from app.services.orders import OrderService
from app.services.public_shop import PublicShopService

router = APIRouter(prefix="/shops", tags=["public shop"])


@router.get("/{slug}")
def show(slug: str, db: DbDep) -> dict[str, Any]:
    return {"data": resources.shop(PublicShopService(db).shop(slug))}


@router.get("/{slug}/products")
def products(slug: str, db: DbDep) -> dict[str, Any]:
    service = PublicShopService(db)
    return {"data": [resources.public_product(p) for p in service.catalog(service.shop(slug))]}


@router.post(
    "/{slug}/orders",
    status_code=201,
    dependencies=[Depends(rate_limit(lambda settings: settings.order_rate_limit))],
)
def order(slug: str, payload: OrderIn, db: DbDep) -> dict[str, Any]:
    shop = PublicShopService(db).shop(slug)
    return {"data": resources.order(OrderService(db).create(shop, payload))}
