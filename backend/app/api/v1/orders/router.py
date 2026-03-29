import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.dependencies import get_current_user, require_any_role, require_role
from app.db.base import get_db
from app.db.models.order import OrderStatus
from app.db.models.user import User
from app.schemas.order import (
    AssignRiderRequest,
    InStoreCleanupResponse,
    InStoreOrderCreate,
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
)
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


@router.get(
    "/orders/track/{order_id}",
    response_model=OrderResponse,
    summary="Public order tracking",
    description="Lets anyone track an order by ID + phone number. No auth required.",
)
async def track_order(
    order_id: uuid.UUID,
    phone: str = Query(..., description="Phone number used on the order"),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.track_order(order_id=order_id, phone=phone)


@router.post(
    "/orders/{order_id}/confirm-payment",
    response_model=OrderResponse,
    summary="Confirm payment (client-side)",
    description="Called by the client after Paystack onSuccess. Verifies with Paystack API and marks order paid.",
)
async def confirm_payment(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.confirm_payment(order_id=order_id, user_id=current_user.id)


@router.post(
    "/orders/webhook/paystack",
    status_code=status.HTTP_200_OK,
    summary="Paystack webhook",
    description="Receives Paystack charge events, verifies HMAC-SHA512 signature, updates payment status.",
    include_in_schema=False,
)
async def paystack_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    payload = await request.body()
    signature = request.headers.get("x-paystack-signature", "")
    service = OrderService(db)
    await service.process_paystack_webhook(payload, signature)
    return {"status": "ok"}


# ── Admin endpoints ────────────────────────────────────────────────────────────

@router.get(
    "/admin/orders",
    response_model=list[OrderResponse],
    summary="List all orders (admin)",
    description="Returns all orders, filterable by status. Admin only.",
)
async def list_all_orders(
    order_status: OrderStatus | None = Query(default=None, alias="status"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    _current_user: User = Depends(require_any_role("admin", "staff")),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.list_all_orders(status=order_status, offset=offset, limit=limit)


@router.get(
    "/admin/orders/{order_id}",
    response_model=OrderResponse,
    summary="Get order by ID (admin)",
    description="Returns any order by ID. Admin/staff only.",
)
async def admin_get_order(
    order_id: uuid.UUID,
    _current_user: User = Depends(require_any_role("admin", "staff")),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.get_order(order_id=order_id)


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


@router.post(
    "/admin/orders/{order_id}/assign-rider",
    response_model=OrderResponse,
    summary="Assign rider to order (admin)",
    description="Assigns a dispatch rider to an order. Admin/staff only.",
)
async def assign_rider(
    order_id: uuid.UUID,
    body: AssignRiderRequest,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.assign_rider(order_id=order_id, rider_id=body.rider_id)


@router.post(
    "/admin/orders/in-store",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create in-store purchase order (admin/staff)",
    description="Creates an in-store order as unpaid pending. Payment is confirmed in a separate step.",
)
async def create_in_store_order(
    body: InStoreOrderCreate,
    current_user: User = Depends(require_any_role("admin", "staff")),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.create_in_store_order(staff_user=current_user, data=body)


@router.post(
    "/admin/orders/{order_id}/confirm-in-store-payment",
    response_model=OrderResponse,
    summary="Confirm in-store payment (admin/staff)",
    description="Marks an in-store order as paid and delivered. Staff can only confirm orders they created.",
)
async def confirm_in_store_payment(
    order_id: uuid.UUID,
    current_user: User = Depends(require_any_role("admin", "staff")),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.confirm_in_store_payment(order_id=order_id, actor=current_user)


@router.post(
    "/admin/orders/in-store/cleanup-pending",
    response_model=InStoreCleanupResponse,
    summary="Cleanup stale pending in-store orders (admin)",
    description="Cancels unpaid in-store orders from previous days and restores stock quantities.",
)
async def cleanup_pending_in_store_orders(
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    cancelled_count = await service.cleanup_pending_in_store_orders_eod()
    return InStoreCleanupResponse(cancelled_count=cancelled_count)
