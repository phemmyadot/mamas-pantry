import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.models.pre_order import PreOrder
from app.schemas.pre_order import PreOrderCreate


class PreOrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: uuid.UUID, data: PreOrderCreate) -> PreOrder:
        pre_order = PreOrder(
            user_id=user_id,
            product_id=data.product_id,
            shipment_id=data.shipment_id,
            quantity=data.quantity,
        )
        self.db.add(pre_order)
        await self.db.flush()
        await self.db.refresh(pre_order)
        return pre_order

    async def list_mine(self, user_id: uuid.UUID) -> list[PreOrder]:
        result = await self.db.execute(
            select(PreOrder)
            .where(PreOrder.user_id == user_id)
            .order_by(PreOrder.created_at.desc())
        )
        return list(result.scalars().all())

    async def get(self, pre_order_id: uuid.UUID, user_id: uuid.UUID | None = None) -> PreOrder:
        query = select(PreOrder).where(PreOrder.id == pre_order_id)
        if user_id:
            query = query.where(PreOrder.user_id == user_id)
        result = await self.db.execute(query)
        pre_order = result.scalar_one_or_none()
        if not pre_order:
            raise NotFoundError("Pre-order not found")
        return pre_order
