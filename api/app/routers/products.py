from typing import Any

from fastapi import APIRouter, Response

from app import resources
from app.deps import DbDep, ShopIdDep
from app.schemas import ProductIn, ProductPatch, StockAdjustIn
from app.services.products import ProductService
from app.services.stock import StockService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
def index(db: DbDep, shop_id: ShopIdDep) -> dict[str, Any]:
    return {"data": [resources.product(p) for p in ProductService(db).list(shop_id)]}


@router.get("/{product_id}")
def show(product_id: int, db: DbDep, shop_id: ShopIdDep) -> dict[str, Any]:
    return {"data": resources.product(ProductService(db).find(shop_id, product_id))}


@router.post("", status_code=201)
def store(payload: ProductIn, db: DbDep, shop_id: ShopIdDep) -> dict[str, Any]:
    product = ProductService(db).create(shop_id, payload.model_dump(exclude_unset=True))
    return {"data": resources.product(product)}


@router.api_route("/{product_id}", methods=["PUT", "PATCH"])
def update(product_id: int, payload: ProductPatch, db: DbDep, shop_id: ShopIdDep) -> dict[str, Any]:
    product = ProductService(db).update(shop_id, product_id, payload.model_dump(exclude_unset=True))
    return {"data": resources.product(product)}


@router.delete("/{product_id}", status_code=204)
def destroy(product_id: int, db: DbDep, shop_id: ShopIdDep) -> Response:
    ProductService(db).delete(shop_id, product_id)
    return Response(status_code=204)


@router.post("/{product_id}/stock")
def adjust_stock(product_id: int, payload: StockAdjustIn, db: DbDep, shop_id: ShopIdDep) -> dict[str, Any]:
    product = ProductService(db).find(shop_id, product_id)
    return {"data": resources.product(StockService(db).adjust(product, payload.delta, payload.reason))}
