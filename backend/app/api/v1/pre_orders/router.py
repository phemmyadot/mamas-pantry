from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.dependencies import get_current_user
from app.db.base import get_db
from app.db.models.user import User
from app.schemas.pre_order import PreOrderCreate, PreOrderResponse
from app.services.pre_order_service import PreOrderService

router = APIRouter(tags=["pre-orders"])


@router.post(
    "/pre-orders",
    response_model=PreOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Place a pre-order",
    description="Pre-order a product from an upcoming shipment. Requires authentication.",
)
async def create_pre_order(
    body: PreOrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PreOrderService(db)
    return await service.create(user_id=current_user.id, data=body)


@router.get(
    "/pre-orders/mine",
    response_model=list[PreOrderResponse],
    summary="My pre-orders",
    description="Returns the authenticated user's active pre-orders.",
)
async def my_pre_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = PreOrderService(db)
    return await service.list_mine(user_id=current_user.id)
