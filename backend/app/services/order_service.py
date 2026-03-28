import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.db.models.order import Order, OrderItem, OrderStatus
from app.db.models.product import Product
from app.schemas.order import OrderCreate, OrderStatusUpdate


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_order(self, user_id: uuid.UUID, data: OrderCreate) -> Order:
        items: list[OrderItem] = []
        total = Decimal("0")

        for line in data.items:
            result = await self.db.execute(
                select(Product).where(Product.id == line.product_id, Product.is_active.is_(True))
            )
            product = result.scalar_one_or_none()
            if not product:
                raise NotFoundError(f"Product {line.product_id} not found or unavailable")
            if product.stock_qty < line.qty:
                raise ValidationError(f"Insufficient stock for '{product.name}' (available: {product.stock_qty})")

            unit_price = Decimal(str(product.price_ngn))
            total += unit_price * line.qty
            product.stock_qty -= line.qty

            items.append(OrderItem(
                product_id=line.product_id,
                product_name=product.name,
                qty=line.qty,
                unit_price_ngn=unit_price,
            ))

        order = Order(
            user_id=user_id,
            status=OrderStatus.pending,
            total_ngn=total,
            delivery_address=data.delivery_address.model_dump(),
            items=items,
        )
        self.db.add(order)
        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def get_order(self, order_id: uuid.UUID, user_id: uuid.UUID | None = None) -> Order:
        query = select(Order).where(Order.id == order_id)
        if user_id:
            query = query.where(Order.user_id == user_id)
        result = await self.db.execute(query)
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundError("Order not found")
        return order

    async def list_user_orders(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Order]:
        result = await self.db.execute(
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def list_all_orders(
        self,
        status: OrderStatus | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Order]:
        query = select(Order)
        if status:
            query = query.where(Order.status == status)
        query = query.order_by(Order.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_status(self, order_id: uuid.UUID, data: OrderStatusUpdate) -> Order:
        result = await self.db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundError("Order not found")
        order.status = data.status
        await self.db.flush()
        await self.db.refresh(order)
        return order
