import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.db.models.product import ProductCategory


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    price_ngn: Decimal = Field(..., gt=0, decimal_places=2)
    category: ProductCategory
    badge: str | None = Field(None, max_length=50)
    image_url: str | None = Field(None, max_length=500)
    stock_qty: int = Field(0, ge=0)
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    price_ngn: Decimal | None = Field(None, gt=0, decimal_places=2)
    category: ProductCategory | None = None
    badge: str | None = Field(None, max_length=50)
    image_url: str | None = Field(None, max_length=500)
    stock_qty: int | None = Field(None, ge=0)
    is_active: bool | None = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    price_ngn: Decimal
    category: ProductCategory
    badge: str | None
    image_url: str | None
    stock_qty: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
