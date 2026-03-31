import io
import logging
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB

# Magic-byte signatures for allowed image types
_MAGIC: list[tuple[bytes, str]] = [
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"RIFF", "image/webp"),   # also verify bytes 8-11 == b"WEBP"
    (b"GIF87a", "image/gif"),
    (b"GIF89a", "image/gif"),
]


def _detect_mime(data: bytes) -> str | None:
    """Return detected MIME type from magic bytes, or None if unrecognised."""
    for magic, mime in _MAGIC:
        if data[:len(magic)] == magic:
            if mime == "image/webp" and data[8:12] != b"WEBP":
                continue
            return mime
    return None

from app.api.v1.auth.dependencies import get_current_user, require_any_role, require_role
from app.core.config import settings
from app.db.base import get_db
from app.db.models.product import ProductCategory
from app.db.models.user import User
from app.schemas.product import CategoryStat, ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter(tags=["products"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


class ImageUploadResponse(BaseModel):
    public_url: str


class DeleteImageRequest(BaseModel):
    image_url: str


def _r2_key_from_url(image_url: str) -> str | None:
    """Extract the R2 object key from a public URL, e.g. .../products/uuid.jpg → products/uuid.jpg"""
    base = settings.R2_PUBLIC_URL.rstrip("/")
    if base and image_url.startswith(base + "/"):
        return image_url[len(base) + 1:]
    return None


def _s3_client():
    import boto3
    from botocore.config import Config
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


@router.post(
    "/admin/products/delete-image",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product image from Cloudflare R2",
)
async def delete_product_image(
    body: DeleteImageRequest,
    current_user: User = Depends(require_any_role("admin", "super_admin", "staff")),
):
    if not all([settings.R2_ACCOUNT_ID, settings.R2_ACCESS_KEY_ID, settings.R2_SECRET_ACCESS_KEY, settings.R2_BUCKET_NAME, settings.R2_PUBLIC_URL]):
        return  # R2 not configured — nothing to delete

    key = _r2_key_from_url(body.image_url)
    if not key:
        return  # Not an R2 URL (e.g. external URL) — ignore

    try:
        _s3_client().delete_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
    except Exception:
        pass  # best-effort


@router.post(
    "/admin/products/upload-image",
    response_model=ImageUploadResponse,
    summary="Upload product image to Cloudflare R2",
)
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_any_role("admin", "super_admin", "staff")),
):
    if not all([settings.R2_ACCOUNT_ID, settings.R2_ACCESS_KEY_ID, settings.R2_SECRET_ACCESS_KEY, settings.R2_BUCKET_NAME, settings.R2_PUBLIC_URL]):
        raise HTTPException(status_code=503, detail="Image upload is not configured")

    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")

    detected = _detect_mime(contents)
    if detected not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}
    ext = ext_map[detected]  # type: ignore[index]
    key = f"products/{uuid.uuid4()}.{ext}"

    try:
        _s3_client().upload_fileobj(
            io.BytesIO(contents), settings.R2_BUCKET_NAME, key,
            ExtraArgs={"ContentType": detected},
        )
    except Exception:
        logger.exception("R2 upload failed for key %s", key)
        raise HTTPException(status_code=500, detail="Image upload failed")

    public_url = f"{settings.R2_PUBLIC_URL.rstrip('/')}/{key}"
    return ImageUploadResponse(public_url=public_url)


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
    _current_user: User = Depends(require_any_role("admin", "staff")),
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
    _current_user: User = Depends(require_any_role("admin", "staff")),
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


@router.get(
    "/admin/products/by-sku/{sku}",
    response_model=ProductResponse,
    summary="Get product by SKU (admin/staff)",
    description="Returns a single active product by SKU for barcode/in-store lookup.",
)
async def admin_get_product_by_sku(
    sku: str,
    _current_user: User = Depends(require_any_role("admin", "staff")),
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    return await service.get_by_sku(sku, active_only=True)


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
    product = await service.get(product_id)
    image_url = product.image_url
    await service.delete(product_id)
    # Clean up R2 image after successful DB delete
    if image_url:
        key = _r2_key_from_url(image_url)
        if key:
            try:
                _s3_client().delete_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
            except Exception:
                pass  # best-effort
