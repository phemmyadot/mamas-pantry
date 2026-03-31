import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RoleSlim(BaseModel):
    name: str
    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    username: str | None
    phone: str | None = None
    is_active: bool
    is_verified: bool
    current_lat: float | None = None
    current_lng: float | None = None
    created_at: datetime
    updated_at: datetime
    roles: list[RoleSlim] = []

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
