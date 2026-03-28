from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.dependencies import get_current_user
from app.db.base import get_db
from app.db.models.user import User
from app.schemas.loyalty import LoyaltyBalanceResponse
from app.services.loyalty_service import LoyaltyService, NGN_PER_POINT

router = APIRouter(tags=["loyalty"])


@router.get(
    "/loyalty/me",
    response_model=LoyaltyBalanceResponse,
    summary="My loyalty balance",
    description="Returns the authenticated user's current loyalty point balance and recent transactions.",
)
async def my_loyalty(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LoyaltyService(db)
    points = await service.balance(current_user.id)
    txs = await service.transactions(current_user.id)
    return LoyaltyBalanceResponse(
        points=points,
        ngn_value=float(points * NGN_PER_POINT),
        transactions=txs,
    )
