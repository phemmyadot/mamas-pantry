import uuid
from enum import Enum
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.db.models.order import OrderStatus, PaymentStatus


class FulfillmentType(str, Enum):
    delivery = "delivery"
    pickup = "pickup"


class DeliveryAddress(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)
    address: str = Field(..., min_length=5, max_length=300)
    area: str | None = Field(None, min_length=1, max_length=100)
    city: str = Field(..., min_length=1, max_length=100)

    @field_validator("phone")
    @classmethod
    def validate_nigerian_phone(cls, value: str) -> str:
        compact = value.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if compact.startswith("+234"):
            compact = f"0{compact[4:]}"
        elif compact.startswith("234"):
            compact = f"0{compact[3:]}"

        if not (compact.isdigit() and len(compact) == 11 and compact.startswith("0") and compact[1] in {"7", "8", "9"}):
            raise ValueError("Phone must be a valid Nigerian number (e.g. 08012345678 or +2348012345678)")
        return compact


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    qty: int = Field(..., ge=1)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(..., min_length=1)
    delivery_address: DeliveryAddress
    fulfillment_type: FulfillmentType = FulfillmentType.delivery
    promo_code: str | None = None
    notes: str | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class AssignRiderRequest(BaseModel):
    rider_id: uuid.UUID


class PaystackWebhookEvent(BaseModel):
    event: str
    data: dict


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    qty: int
    unit_price_ngn: Decimal

    model_config = {"from_attributes": True}


class OrderRiderResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    is_active: bool
    current_lat: Decimal | None
    current_lng: Decimal | None

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: OrderStatus
    payment_status: PaymentStatus
    payment_ref: str | None
    subtotal_ngn: Decimal
    delivery_fee_ngn: Decimal
    total_ngn: Decimal
    delivery_address: dict
    rider_id: uuid.UUID | None
    rider: OrderRiderResponse | None = None
    notes: str | None
    items: list[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
