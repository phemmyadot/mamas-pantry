from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.auth.dependencies import get_current_user, require_role
from app.db.base import get_db
from app.db.models.user import User
from app.services.notification_service import NotificationService

router = APIRouter(tags=["notifications"])


class SubscribeRequest(BaseModel):
    token: str


class BroadcastRequest(BaseModel):
    title: str
    body: str


class BroadcastResponse(BaseModel):
    sent_to: int


@router.post(
    "/notifications/subscribe",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Register FCM push token",
    description="Saves the device's FCM token so order status push notifications can be delivered.",
)
async def subscribe(
    body: SubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    await service.subscribe(user_id=current_user.id, token=body.token)


@router.post(
    "/admin/notifications/broadcast",
    response_model=BroadcastResponse,
    summary="Broadcast push notification (admin)",
    description="Sends a push notification to all subscribed users. Admin only.",
)
async def broadcast(
    body: BroadcastRequest,
    _current_user: User = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    service = NotificationService(db)
    sent_to = await service.broadcast(title=body.title, body=body.body)
    return BroadcastResponse(sent_to=sent_to)
