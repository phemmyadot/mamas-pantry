from __future__ import annotations
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.db.models.shipment import Shipment, ShipmentStatus
from app.db.models.product import Product
from app.schemas.shipment import ShipmentCreate, ShipmentUpdate


class ShipmentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list(self) -> list[Shipment]:
        result = await self.db.execute(
            select(Shipment).order_by(Shipment.arrival_date.asc())
        )
        return list(result.scalars().all())

    async def get(self, shipment_id: uuid.UUID) -> Shipment:
        result = await self.db.execute(select(Shipment).where(Shipment.id == shipment_id))
        shipment = result.scalar_one_or_none()
        if not shipment:
            raise NotFoundError("Shipment not found")
        return shipment

    async def get_products(self, shipment_id: uuid.UUID) -> list[Product]:
        """Returns products available for pre-order on a shipment.

        Currently returns all imported, active products. When pre-order product
        linking is built out this will filter by shipment_id.
        """
        await self.get(shipment_id)  # ensure shipment exists
        result = await self.db.execute(
            select(Product)
            .where(Product.is_active.is_(True), Product.category == "imported")
            .order_by(Product.name)
        )
        return list(result.scalars().all())

    async def create(self, data: ShipmentCreate) -> Shipment:
        shipment = Shipment(**data.model_dump())
        self.db.add(shipment)
        await self.db.flush()
        await self.db.refresh(shipment)
        return shipment

    async def update(self, shipment_id: uuid.UUID, data: ShipmentUpdate) -> Shipment:
        shipment = await self.get(shipment_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(shipment, field, value)
        await self.db.flush()
        await self.db.refresh(shipment)
        return shipment
