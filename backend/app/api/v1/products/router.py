import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.dependencies import get_current_user, require_role
from app.db.base import get_db
from app.db.models.product import ProductCategory
from app.db.models.user import User
from app.schemas.product import CategoryStat, ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter(tags=["products"])


@router.get(
    "/products/featured",
    response_model=list[ProductResponse],
    summary="Featured (Mum's Picks)",
    description="Returns all active products where `is_mums_pick=true`.",
)
async def featured_products(db: AsyncSession = Depends(get_db)):
    service = ProductService(db)
    return await service.featured()


@router.get(
    "/categories",
    response_model=list[CategoryStat],
    summary="Category stats",
    description="Returns all 4 categories with active product counts.",
)
async def category_stats(db: AsyncSession = Depends(get_db)):
    service = ProductService(db)
    return await service.category_stats()


@router.get(
    "/products",
    response_model=list[ProductResponse],
    summary="List products",
    description="Returns active products. Filterable by category, mums_pick, and search term.",
)
async def list_products(
    category: ProductCategory | None = Query(default=None),
    mums_pick: bool | None = Query(default=None),
    search: str | None = Query(default=None, max_length=100),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    products, _ = await service.list(
        category=category, mums_pick=mums_pick, search=search, offset=offset, limit=limit
    )
    return products


@router.get(
    "/products/{slug}",
    response_model=ProductResponse,
    summary="Get product by slug",
    description="Returns a single active product by URL slug.",
)
async def get_product(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    # Accept both slugs and UUIDs for backwards compatibility
    try:
        product_id = uuid.UUID(slug)
        return await service.get(product_id)
    except ValueError:
        return await service.get_by_slug(slug)


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.get(
    "/admin/products",
    response_model=list[ProductResponse],
    summary="List all products (admin)",
    description="Returns all products including inactive ones. Admin only.",
)
async def admin_list_products(
    category: ProductCategory | None = Query(default=None),
    search: str | None = Query(default=None, max_length=100),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    products, _ = await service.list(
        category=category, search=search, active_only=False, offset=offset, limit=limit
    )
    return products


@router.get(
    "/admin/inventory/low-stock",
    response_model=list[ProductResponse],
    summary="Low-stock products (admin)",
    description="Returns products with stock_qty at or below the reorder threshold (default: 5).",
)
async def low_stock(
    threshold: int = Query(default=5, ge=0),
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    from app.db.models.product import Product
    result = await db.execute(
        select(Product)
        .where(Product.stock_qty <= threshold, Product.is_active.is_(True))
        .order_by(Product.stock_qty.asc())
    )
    return list(result.scalars().all())


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
