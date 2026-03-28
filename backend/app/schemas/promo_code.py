import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.db.models.promo_code import DiscountType


class PromoCodeCreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=50, pattern=r"^[A-Z0-9_-]+$")
    discount_type: DiscountType
    discount_value: Decimal = Field(..., gt=0, decimal_places=2)
    min_order_ngn: Decimal | None = Field(None, ge=0, decimal_places=2)
    max_uses: int | None = Field(None, gt=0)
    expires_at: datetime | None = None


class PromoCodeResponse(BaseModel):
    id: uuid.UUID
    code: str
    discount_type: DiscountType
    discount_value: Decimal
    min_order_ngn: Decimal | None
    max_uses: int | None
    used_count: int
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PromoCodeValidateRequest(BaseModel):
    code: str
    order_total_ngn: Decimal = Field(..., gt=0)


class PromoCodeValidateResponse(BaseModel):
    valid: bool
    discount_amount_ngn: Decimal
    message: str
