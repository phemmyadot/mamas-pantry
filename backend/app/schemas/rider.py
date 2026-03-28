import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class RiderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)
    is_active: bool = True


class RiderUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    phone: str | None = Field(None, min_length=7, max_length=20)
    is_active: bool | None = None
    current_lat: Decimal | None = None
    current_lng: Decimal | None = None


class RiderResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    is_active: bool
    current_lat: Decimal | None
    current_lng: Decimal | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
