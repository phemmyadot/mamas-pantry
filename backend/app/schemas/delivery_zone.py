from datetime import datetime

from pydantic import BaseModel, Field


class DeliveryZoneFeeInput(BaseModel):
    area: str = Field(..., min_length=1, max_length=100)
    fee_ngn: float = Field(..., ge=0)


class DeliveryZoneFeeResponse(BaseModel):
    id: str
    area: str
    fee_ngn: float
    created_at: datetime
    updated_at: datetime

