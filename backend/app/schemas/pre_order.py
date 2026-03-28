import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.db.models.pre_order import PreOrderStatus


class PreOrderCreate(BaseModel):
    product_id: uuid.UUID
    shipment_id: uuid.UUID
    quantity: int = Field(..., ge=1)


class PreOrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    product_id: uuid.UUID
    shipment_id: uuid.UUID
    quantity: int
    status: PreOrderStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
