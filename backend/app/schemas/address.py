import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AddressCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=50)
    street: str = Field(..., min_length=5, max_length=300)
    area: str = Field(..., min_length=1, max_length=100)
    city: str = Field(..., min_length=1, max_length=100)
    is_default: bool = False


class AddressUpdate(BaseModel):
    label: str | None = Field(None, min_length=1, max_length=50)
    street: str | None = Field(None, min_length=5, max_length=300)
    area: str | None = Field(None, min_length=1, max_length=100)
    city: str | None = Field(None, min_length=1, max_length=100)
    is_default: bool | None = None


class AddressResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    label: str
    street: str
    area: str
    city: str
    is_default: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
