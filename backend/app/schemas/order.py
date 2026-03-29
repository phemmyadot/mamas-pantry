import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.db.models.order import OrderStatus, PaymentStatus


class DeliveryAddress(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=7, max_length=20)
    address: str = Field(..., min_length=5, max_length=300)
    city: str = Field(..., min_length=1, max_length=100)


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    qty: int = Field(..., ge=1)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(..., min_length=1)
    delivery_address: DeliveryAddress
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
