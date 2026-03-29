import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.db.models.product import ProductCategory


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=220, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    sku: str | None = Field(default=None, min_length=2, max_length=64)
    description: str | None = None
    price_ngn: Decimal = Field(..., gt=0, decimal_places=2)
    compare_price_ngn: Decimal | None = Field(None, gt=0, decimal_places=2)
    category: ProductCategory
    is_mums_pick: bool = False
    badge: str | None = Field(None, max_length=50)
    origin: str | None = Field(None, max_length=100)
    image_url: str | None = Field(None, max_length=500)
    images: list[str] = Field(default_factory=list)
    stock_qty: int = Field(0, ge=0)
    is_active: bool = True

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip().upper()


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    slug: str | None = Field(None, min_length=1, max_length=220, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    sku: str | None = Field(default=None, min_length=2, max_length=64)
    description: str | None = None
    price_ngn: Decimal | None = Field(None, gt=0, decimal_places=2)
    compare_price_ngn: Decimal | None = Field(None, gt=0, decimal_places=2)
    category: ProductCategory | None = None
    is_mums_pick: bool | None = None
    badge: str | None = Field(None, max_length=50)
    origin: str | None = Field(None, max_length=100)
    image_url: str | None = Field(None, max_length=500)
    images: list[str] | None = None
    stock_qty: int | None = Field(None, ge=0)
    is_active: bool | None = None

    @field_validator("sku")
    @classmethod
    def normalize_sku(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip().upper()


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    sku: str
    description: str | None
    price_ngn: Decimal
    compare_price_ngn: Decimal | None
    category: ProductCategory
    is_mums_pick: bool
    badge: str | None
    origin: str | None
    image_url: str | None
    images: list[str]
    stock_qty: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategoryStat(BaseModel):
    category: ProductCategory
    product_count: int
