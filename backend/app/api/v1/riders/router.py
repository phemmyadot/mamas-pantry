"""Rider self-service endpoints — profile, assigned deliveries, mark delivered."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.auth.dependencies import require_role
from app.db.base import get_db
from app.db.models.order import Order, OrderStatus
from app.db.models.user import User
from app.schemas.order import OrderResponse
from app.schemas.user import UserResponse

router = APIRouter(prefix="/riders", tags=["riders"])


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get own rider profile",
)
async def get_my_profile(
    current_user: User = Depends(require_role("rider")),
) -> User:
    return current_user


@router.get(
    "/me/orders",
    response_model=list[OrderResponse],
    summary="Get assigned deliveries",
    description="Returns orders assigned to this rider with status `out_for_delivery`.",
)
async def get_my_orders(
    current_user: User = Depends(require_role("rider")),
    db: AsyncSession = Depends(get_db),
) -> list[Order]:
    result = await db.execute(
        select(Order)
        .where(
            Order.rider_id == current_user.id,
            Order.status == OrderStatus.out_for_delivery,
        )
        .options(selectinload(Order.items), selectinload(Order.rider))
        .order_by(Order.created_at.desc())
    )
    return list(result.scalars().all())


@router.patch(
    "/me/orders/{order_id}/delivered",
    response_model=OrderResponse,
    summary="Mark order as delivered",
)
async def mark_delivered(
    order_id: uuid.UUID,
    current_user: User = Depends(require_role("rider")),
    db: AsyncSession = Depends(get_db),
) -> Order:
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.rider_id == current_user.id)
        .options(selectinload(Order.items), selectinload(Order.rider))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status != OrderStatus.out_for_delivery:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Order is '{order.status.value}', only out_for_delivery orders can be marked delivered",
        )

    order.status = OrderStatus.delivered
    await db.flush()
    await db.refresh(order)
    return order
