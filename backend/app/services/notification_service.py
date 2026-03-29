"""Push notification service using Firebase Cloud Messaging (FCM) HTTP v1 API."""
import logging
import uuid

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models.fcm_token import FcmToken
from app.db.models.order import Order

logger = logging.getLogger(__name__)

FCM_SEND_URL = "https://fcm.googleapis.com/fcm/send"

ORDER_STATUS_MESSAGES: dict[str, tuple[str, str]] = {
    "confirmed":        ("Order confirmed ✓", "Your order has been confirmed and will be packed soon."),
    "packed":           ("Order packed 📦", "Your order is packed and ready for pickup by the rider."),
    "ready_for_pickup": ("Ready for pickup", "Your order is ready for pickup at Mama's Pantry."),
    "out_for_delivery": ("Out for delivery 🛵", "Your rider is on the way! Expect delivery shortly."),
    "delivered":        ("Delivered ✓", "Your order has been delivered. Enjoy your groceries!"),
    "cancelled":        ("Order cancelled", "Your order has been cancelled. Contact us if you have questions."),
}


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def subscribe(self, user_id: uuid.UUID, token: str) -> FcmToken:
        """Register or update an FCM token for a user."""
        result = await self.db.execute(select(FcmToken).where(FcmToken.token == token))
        existing = result.scalar_one_or_none()
        if existing:
            existing.user_id = user_id
            await self.db.flush()
            return existing
        fcm = FcmToken(user_id=user_id, token=token)
        self.db.add(fcm)
        await self.db.flush()
        return fcm

    async def _tokens_for_user(self, user_id: uuid.UUID) -> list[str]:
        result = await self.db.execute(
            select(FcmToken.token).where(FcmToken.user_id == user_id)
        )
        return list(result.scalars().all())

    async def _all_tokens(self) -> list[str]:
        result = await self.db.execute(select(FcmToken.token))
        return list(result.scalars().all())

    async def _send(self, tokens: list[str], title: str, body: str) -> None:
        """Send FCM notification via legacy HTTP API. No-op if key not configured."""
        key = getattr(settings, "FCM_SERVER_KEY", "")
        if not key or not tokens:
            return
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                payload = {
                    "registration_ids": tokens,
                    "notification": {"title": title, "body": body},
                    "priority": "high",
                }
                resp = await client.post(
                    FCM_SEND_URL,
                    json=payload,
                    headers={"Authorization": f"key={key}", "Content-Type": "application/json"},
                )
                if resp.status_code != 200:
                    logger.warning("FCM send failed: %s %s", resp.status_code, resp.text)
        except Exception as exc:
            logger.warning("FCM send error: %s", exc)

    async def notify_order_status(self, order: Order) -> None:
        """Send push notification to order owner when status changes."""
        msg = ORDER_STATUS_MESSAGES.get(order.status)
        if not msg:
            return
        title, body = msg
        tokens = await self._tokens_for_user(order.user_id)
        await self._send(tokens, title, body)

    async def broadcast(self, title: str, body: str) -> int:
        """Send notification to all subscribed users. Returns token count."""
        tokens = await self._all_tokens()
        await self._send(tokens, title, body)
        return len(tokens)
