from __future__ import annotations
import uuid

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.models.product import Product, ProductCategory
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(
        self,
        category: ProductCategory | None = None,
        mums_pick: bool | None = None,
        search: str | None = None,
        active_only: bool = True,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Product], int]:
        query = select(Product)
        if active_only:
            query = query.where(Product.is_active.is_(True))
        if category:
            query = query.where(Product.category == category)
        if mums_pick is not None:
            query = query.where(Product.is_mums_pick.is_(mums_pick))
        if search:
            query = query.where(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.slug.ilike(f"%{search}%"),
                    Product.sku.ilike(f"%{search}%"),
                )
            )

        count_q = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_q)).scalar_one()

        query = query.order_by(Product.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def featured(self) -> list[Product]:
        result = await self.db.execute(
            select(Product)
            .where(Product.is_mums_pick.is_(True), Product.is_active.is_(True))
            .order_by(Product.created_at.desc())
            .limit(12)
        )
        return list(result.scalars().all())

    async def category_stats(self) -> list[dict]:
        rows = await self.db.execute(
            select(Product.category, func.count(Product.id).label("product_count"))
            .where(Product.is_active.is_(True))
            .group_by(Product.category)
        )
        return [{"category": row.category, "product_count": row.product_count} for row in rows]

    async def get(self, product_id: uuid.UUID) -> Product:
        result = await self.db.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()
        if not product:
            raise NotFoundError("Product not found")
        return product

    async def get_by_slug(self, slug: str) -> Product:
        result = await self.db.execute(
            select(Product).where(Product.slug == slug, Product.is_active.is_(True))
        )
        product = result.scalar_one_or_none()
        if not product:
            raise NotFoundError("Product not found")
        return product

    async def get_by_sku(self, sku: str, active_only: bool = True) -> Product:
        query = select(Product).where(Product.sku == sku.strip().upper())
        if active_only:
            query = query.where(Product.is_active.is_(True))
        result = await self.db.execute(query)
        product = result.scalar_one_or_none()
        if not product:
            raise NotFoundError("Product not found")
        return product

    async def create(self, data: ProductCreate) -> Product:
        payload = data.model_dump()
        if not payload.get("sku"):
            payload["sku"] = await self._generate_next_sku()
        product = Product(**payload)
        self.db.add(product)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def update(self, product_id: uuid.UUID, data: ProductUpdate) -> Product:
        product = await self.get(product_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(product, field, value)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def delete(self, product_id: uuid.UUID) -> None:
        product = await self.get(product_id)
        await self.db.delete(product)
        await self.db.flush()

    async def _generate_next_sku(self) -> str:
        result = await self.db.execute(
            select(Product.sku)
            .where(Product.sku.ilike("SKU-%"))
            .order_by(Product.sku.desc())
            .limit(1)
        )
        latest = result.scalar_one_or_none()
        if not latest:
            return "SKU-000001"
        try:
            next_num = int(latest.split("-")[-1]) + 1
        except ValueError:
            next_num = 1
        return f"SKU-{next_num:06d}"
