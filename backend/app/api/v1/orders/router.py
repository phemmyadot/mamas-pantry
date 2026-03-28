import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.dependencies import get_current_user, require_role
from app.db.base import get_db
from app.db.models.order import OrderStatus
from app.db.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.order_service import OrderService

router = APIRouter(tags=["orders"])


@router.post(
    "/orders",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Place an order",
    description="Creates a new order, validates stock, and deducts inventory. Requires authentication.",
)
async def create_order(
    body: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.create_order(user_id=current_user.id, data=body)


@router.get(
    "/orders/me",
    response_model=list[OrderResponse],
    summary="My orders",
    description="Returns the authenticated user's order history, newest first.",
)
async def my_orders(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.list_user_orders(user_id=current_user.id, offset=offset, limit=limit)


@router.get(
    "/orders/me/{order_id}",
    response_model=OrderResponse,
    summary="Get my order",
    description="Returns a single order belonging to the authenticated user.",
)
async def get_my_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.get_order(order_id=order_id, user_id=current_user.id)


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.get(
    "/admin/orders",
    response_model=list[OrderResponse],
    summary="List all orders (admin)",
    description="Returns all orders, filterable by status. Admin only.",
)
async def list_all_orders(
    status: OrderStatus | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.list_all_orders(status=status, offset=offset, limit=limit)


@router.patch(
    "/admin/orders/{order_id}/status",
    response_model=OrderResponse,
    summary="Update order status (admin)",
    description="Updates the status of an order. Admin only.",
)
async def update_order_status(
    order_id: uuid.UUID,
    body: OrderStatusUpdate,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.update_status(order_id=order_id, data=body)
