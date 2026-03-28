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
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    roles: list[RoleSlim] = []

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
