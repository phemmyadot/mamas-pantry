from __future__ import annotations
import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.loyalty import LoyaltyTransaction, LoyaltyTransactionType

# 1 point earned per ₦100 spent; 1 point = ₦1 redemption value
POINTS_PER_NGN = Decimal("0.01")   # earn rate: 1 pt per ₦100
NGN_PER_POINT = Decimal("1.00")    # redeem rate: 1 pt = ₦1


class LoyaltyService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def earn(self, user_id: uuid.UUID, order_id: uuid.UUID, total_ngn: Decimal) -> LoyaltyTransaction:
        """Credit points when an order is delivered. 1 point per ₦100 spent."""
        points = max(1, int(total_ngn * POINTS_PER_NGN))
        tx = LoyaltyTransaction(
            user_id=user_id,
            order_id=order_id,
            points=points,
            type=LoyaltyTransactionType.EARN,
            description=f"Earned from order delivery (+{points} pts)",
        )
        self.db.add(tx)
        await self.db.flush()
        return tx

    async def balance(self, user_id: uuid.UUID) -> int:
        """Return current point balance (earned - redeemed - expired)."""
        result = await self.db.execute(
            select(func.coalesce(func.sum(LoyaltyTransaction.points), 0))
            .where(
                LoyaltyTransaction.user_id == user_id,
                LoyaltyTransaction.type.in_([
                    LoyaltyTransactionType.EARN,
                    LoyaltyTransactionType.REDEEM,
                    LoyaltyTransactionType.EXPIRE,
                ]),
            )
        )
        # EARN is positive, REDEEM/EXPIRE are stored as negative
        return int(result.scalar() or 0)

    async def transactions(self, user_id: uuid.UUID, limit: int = 20) -> list[LoyaltyTransaction]:
        result = await self.db.execute(
            select(LoyaltyTransaction)
            .where(LoyaltyTransaction.user_id == user_id)
            .order_by(LoyaltyTransaction.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
