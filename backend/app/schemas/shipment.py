import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.db.models.shipment import ShipmentStatus


class ShipmentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    origin_country: str = Field(..., min_length=1, max_length=100)
    departure_date: date
    arrival_date: date
    status: ShipmentStatus = ShipmentStatus.upcoming
    notes: str | None = None


class ShipmentUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    origin_country: str | None = Field(None, min_length=1, max_length=100)
    departure_date: date | None = None
    arrival_date: date | None = None
    status: ShipmentStatus | None = None
    notes: str | None = None


class ShipmentResponse(BaseModel):
    id: uuid.UUID
    name: str
    origin_country: str
    departure_date: date
    arrival_date: date
    status: ShipmentStatus
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
