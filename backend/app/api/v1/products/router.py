import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.dependencies import get_current_user, require_role
from app.db.base import get_db
from app.db.models.product import ProductCategory
from app.db.models.user import User
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter(tags=["products"])


@router.get(
    "/products",
    response_model=list[ProductResponse],
    summary="List products",
    description="Returns active products. Filterable by category and search term.",
)
async def list_products(
    category: ProductCategory | None = Query(default=None),
    search: str | None = Query(default=None, max_length=100),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    products, _ = await service.list(category=category, search=search, offset=offset, limit=limit)
    return products


@router.get(
    "/products/{product_id}",
    response_model=ProductResponse,
    summary="Get product",
    description="Returns a single product by ID.",
)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    return await service.get(product_id)


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.post(
    "/admin/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create product (admin)",
    description="Creates a new product. Admin only.",
)
async def create_product(
    body: ProductCreate,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    return await service.create(body)


@router.patch(
    "/admin/products/{product_id}",
    response_model=ProductResponse,
    summary="Update product (admin)",
    description="Partial update of a product. Admin only.",
)
async def update_product(
    product_id: uuid.UUID,
    body: ProductUpdate,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    return await service.update(product_id, body)


@router.delete(
    "/admin/products/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete product (admin)",
    description="Permanently deletes a product. Admin only.",
)
async def delete_product(
    product_id: uuid.UUID,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    await service.delete(product_id)
