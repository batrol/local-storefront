from typing import Any

from fastapi import APIRouter, Response

from app import resources
from app.deps import DbDep, ShopIdDep
from app.schemas import CategoryIn
from app.services.categories import CategoryService

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("")
def index(db: DbDep, shop_id: ShopIdDep) -> dict[str, Any]:
    return {"data": [resources.category(c) for c in CategoryService(db).list(shop_id)]}


@router.post("", status_code=201)
def store(payload: CategoryIn, db: DbDep, shop_id: ShopIdDep) -> dict[str, Any]:
    return {"data": resources.category(CategoryService(db).create(shop_id, payload.name))}


@router.api_route("/{category_id}", methods=["PUT", "PATCH"])
def update(category_id: int, payload: CategoryIn, db: DbDep, shop_id: ShopIdDep) -> dict[str, Any]:
    return {"data": resources.category(CategoryService(db).update(shop_id, category_id, payload.name))}


@router.delete("/{category_id}", status_code=204)
def destroy(category_id: int, db: DbDep, shop_id: ShopIdDep) -> Response:
    CategoryService(db).delete(shop_id, category_id)
    return Response(status_code=204)
