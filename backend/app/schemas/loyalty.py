from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class LoyaltyTransactionResponse(BaseModel):
    id: UUID
    order_id: UUID | None
    points: int
    type: str
    description: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LoyaltyBalanceResponse(BaseModel):
    points: int
    ngn_value: float  # points * 1.0
    transactions: list[LoyaltyTransactionResponse]
