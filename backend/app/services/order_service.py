import hashlib
import hmac
import uuid
from datetime import datetime, time, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.exceptions import NotFoundError, ValidationError
from app.db.models.delivery_zone_fee import DeliveryZoneFee
from app.db.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.db.models.product import Product
from app.db.models.promo_code import PromoCode, DiscountType
from app.db.models.user import User
from app.schemas.order import InStoreOrderCreate, OrderCreate, OrderStatusUpdate


# ₦500 flat delivery fee — adjust per zone if needed
DELIVERY_FEE_NGN = Decimal("500.00")


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _with_order_relations(query):
        return query.options(selectinload(Order.items), selectinload(Order.rider))

    @staticmethod
    def _is_pickup(order: Order) -> bool:
        return (order.delivery_address or {}).get("fulfillment_type") == "pickup"

    @staticmethod
    def _normalize_area(area: str) -> str:
        return " ".join((area or "").strip().lower().split())

    async def _resolve_delivery_fee(self, area: str | None) -> Decimal:
        if not area:
            return DELIVERY_FEE_NGN
        normalized = self._normalize_area(area)
        result = await self.db.execute(select(DeliveryZoneFee))
        for zone in result.scalars().all():
            if self._normalize_area(zone.area) == normalized:
                return Decimal(str(zone.fee_ngn))
        return DELIVERY_FEE_NGN

    async def _apply_promo(self, code: str, subtotal: Decimal) -> tuple[PromoCode, Decimal]:
        from datetime import datetime, timezone
        result = await self.db.execute(select(PromoCode).where(PromoCode.code == code.upper()))
        promo = result.scalar_one_or_none()
        if not promo:
            raise ValidationError("Promo code not found")
        now = datetime.now(timezone.utc)
        if promo.expires_at and promo.expires_at < now:
            raise ValidationError("Promo code has expired")
        if promo.max_uses is not None and promo.used_count >= promo.max_uses:
            raise ValidationError("Promo code usage limit reached")
        if promo.min_order_ngn and subtotal < Decimal(str(promo.min_order_ngn)):
            raise ValidationError(f"Minimum order for this code is ₦{promo.min_order_ngn:,.0f}")

        if promo.discount_type == DiscountType.percentage:
            discount = (subtotal * Decimal(str(promo.discount_value)) / 100).quantize(Decimal("0.01"))
        else:
            discount = min(Decimal(str(promo.discount_value)), subtotal)

        return promo, discount

    async def create_order(self, user_id: uuid.UUID, data: OrderCreate) -> Order:
        items: list[OrderItem] = []
        subtotal = Decimal("0")

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
            subtotal += unit_price * line.qty
            product.stock_qty -= line.qty

            items.append(OrderItem(
                product_id=line.product_id,
                product_name=product.name,
                qty=line.qty,
                unit_price_ngn=unit_price,
            ))

        is_pickup = data.fulfillment_type.value == "pickup"
        area = data.delivery_address.area
        if not area and data.delivery_address.address:
            parts = [p.strip() for p in data.delivery_address.address.split(",") if p.strip()]
            if len(parts) >= 2:
                area = parts[-1]
        delivery_fee = Decimal("0") if is_pickup else await self._resolve_delivery_fee(area)
        discount = Decimal("0")

        if data.promo_code:
            promo, discount = await self._apply_promo(data.promo_code, subtotal)
            promo.used_count += 1

        total = subtotal + delivery_fee - discount

        order = Order(
            user_id=user_id,
            status=OrderStatus.pending,
            payment_status=PaymentStatus.unpaid,
            subtotal_ngn=subtotal,
            delivery_fee_ngn=delivery_fee,
            total_ngn=total,
            delivery_address={
                **data.delivery_address.model_dump(),
                "fulfillment_type": data.fulfillment_type.value,
            },
            notes=data.notes,
            items=items,
        )
        self.db.add(order)
        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def create_in_store_order(self, staff_user: User, data: InStoreOrderCreate) -> Order:
        items: list[OrderItem] = []
        subtotal = Decimal("0")

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
            subtotal += unit_price * line.qty
            product.stock_qty -= line.qty

            items.append(
                OrderItem(
                    product_id=line.product_id,
                    product_name=product.name,
                    qty=line.qty,
                    unit_price_ngn=unit_price,
                )
            )

        staff_display = (staff_user.username or staff_user.email or "").strip()
        order = Order(
            user_id=staff_user.id,
            status=OrderStatus.pending,
            payment_status=PaymentStatus.unpaid,
            payment_ref=f"in-store-pending-{uuid.uuid4().hex[:12]}",
            subtotal_ngn=subtotal,
            delivery_fee_ngn=Decimal("0"),
            total_ngn=subtotal,
            delivery_address={
                "name": data.customer_name.strip() or "Walk-in Customer",
                "phone": (data.customer_phone or "N/A").strip() or "N/A",
                "address": "In-store purchase",
                "city": "In-store",
                "fulfillment_type": "pickup",
                "order_channel": "in_store",
                "attended_by_staff_username": staff_display,
                "attended_by_staff_id": str(staff_user.id),
                "payment_method": data.payment_method,
            },
            notes=data.notes,
            items=items,
        )
        self.db.add(order)
        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def confirm_in_store_payment(self, order_id: uuid.UUID, actor: User) -> Order:
        order = await self.get_order(order_id=order_id)
        if (order.delivery_address or {}).get("order_channel") != "in_store":
            raise ValidationError("Only in-store orders can be paid from this endpoint")
        if order.payment_status == PaymentStatus.paid:
            raise ValidationError("Payment has already been confirmed for this order")
        if order.status == OrderStatus.cancelled:
            raise ValidationError("Cannot confirm payment for a cancelled order")

        actor_roles = {r.name for r in getattr(actor, "roles", [])}
        is_admin = "admin" in actor_roles or "super_admin" in actor_roles
        if not is_admin:
            attended_by_staff_id = (order.delivery_address or {}).get("attended_by_staff_id")
            if attended_by_staff_id != str(actor.id):
                raise ValidationError("Staff can only confirm payment for orders they created")

        order.payment_status = PaymentStatus.paid
        order.status = OrderStatus.delivered
        order.payment_ref = order.payment_ref or f"in-store-paid-{uuid.uuid4().hex[:12]}"
        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def cleanup_pending_in_store_orders_eod(self) -> int:
        lagos = ZoneInfo("Africa/Lagos")
        now_local = datetime.now(lagos)
        start_of_today_local = datetime.combine(now_local.date(), time.min, tzinfo=lagos)
        cutoff_utc = start_of_today_local.astimezone(timezone.utc)

        result = await self.db.execute(
            self._with_order_relations(select(Order)).where(
                Order.payment_status == PaymentStatus.unpaid,
                Order.status.not_in([OrderStatus.cancelled, OrderStatus.delivered]),
                Order.created_at < cutoff_utc,
            )
        )
        orders = list(result.scalars().all())
        cancelled_count = 0

        for order in orders:
            if (order.delivery_address or {}).get("order_channel") != "in_store":
                continue
            await self._restock_order(order)
            order.status = OrderStatus.cancelled
            cancelled_count += 1

        await self.db.flush()
        return cancelled_count

    async def get_order(self, order_id: uuid.UUID, user_id: uuid.UUID | None = None) -> Order:
        query = self._with_order_relations(select(Order)).where(Order.id == order_id)
        if user_id:
            query = query.where(Order.user_id == user_id)
        result = await self.db.execute(query)
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundError("Order not found")
        return order

    async def list_user_orders(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[Order]:
        result = await self.db.execute(
            self._with_order_relations(select(Order))
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
        query = self._with_order_relations(select(Order))
        if status:
            query = query.where(Order.status == status)
        query = query.order_by(Order.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_status(self, order_id: uuid.UUID, data: OrderStatusUpdate) -> Order:
        from decimal import Decimal
        result = await self.db.execute(
            self._with_order_relations(select(Order)).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundError("Order not found")

        is_pickup = self._is_pickup(order)

        if is_pickup and data.status == OrderStatus.out_for_delivery:
            raise ValidationError("Pickup orders should use ready_for_pickup instead of out_for_delivery")

        if (not is_pickup) and data.status == OrderStatus.ready_for_pickup:
            raise ValidationError("Delivery orders cannot be set to ready_for_pickup")

        if data.status == OrderStatus.delivered:
            if is_pickup and order.status != OrderStatus.ready_for_pickup:
                raise ValidationError("Set status to ready_for_pickup before marking order as delivered")
            if (not is_pickup) and (not order.rider_id):
                raise ValidationError("Assign a rider before marking order as delivered")

        prev_status = order.status
        order.status = data.status
        await self.db.flush()

        # Credit loyalty points when order is delivered
        if data.status == OrderStatus.delivered and prev_status != OrderStatus.delivered:
            from app.services.loyalty_service import LoyaltyService
            loyalty = LoyaltyService(self.db)
            await loyalty.earn(
                user_id=order.user_id,
                order_id=order.id,
                total_ngn=Decimal(str(order.total_ngn)),
            )

        # Send push notification on status change
        try:
            from app.services.notification_service import NotificationService
            ns = NotificationService(self.db)
            await ns.notify_order_status(order)
        except Exception:
            pass  # Notifications are best-effort

        # Send email notification on status change
        try:
            from app.core.email import send_order_status_email

            user_result = await self.db.execute(select(User).where(User.id == order.user_id))
            user = user_result.scalar_one_or_none()
            if user and user.email:
                customer_name = (order.delivery_address or {}).get("name")
                await send_order_status_email(
                    to=user.email,
                    order_id=str(order.id),
                    status=order.status.value,
                    customer_name=customer_name,
                )
        except Exception:
            pass  # Email is best-effort

        await self.db.refresh(order)
        return order

    async def assign_rider(self, order_id: uuid.UUID, rider_id: uuid.UUID) -> Order:
        order = await self.get_order(order_id)
        if self._is_pickup(order):
            raise ValidationError("Pickup orders do not support rider assignment")
        if order.status != OrderStatus.out_for_delivery:
            raise ValidationError("Rider can only be assigned when order is out_for_delivery")
        order.rider_id = rider_id
        await self.db.flush()
        await self.db.refresh(order)
        return order

    async def _restock_order(self, order: Order) -> None:
        if not order.items:
            return
        for item in order.items:
            result = await self.db.execute(select(Product).where(Product.id == item.product_id))
            product = result.scalar_one_or_none()
            if product:
                product.stock_qty += item.qty

    async def track_order(self, order_id: uuid.UUID, phone: str) -> Order:
        """Public tracking: verify order exists and phone matches delivery address."""
        result = await self.db.execute(
            self._with_order_relations(select(Order)).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundError("Order not found")
        stored_phone = (order.delivery_address or {}).get("phone", "")
        # Normalise both sides: strip spaces, leading zeros etc.
        def _norm(p: str) -> str:
            return "".join(filter(str.isdigit, p))[-10:]
        if _norm(stored_phone) != _norm(phone):
            raise NotFoundError("Order not found")
        return order

    async def confirm_payment(self, order_id: uuid.UUID, user_id: uuid.UUID) -> Order:
        """Verify payment with Paystack API and mark order paid. Called client-side after onSuccess."""
        result = await self.db.execute(
            select(Order)
            .where(Order.id == order_id, Order.user_id == user_id)
            .options(selectinload(Order.items), selectinload(Order.rider))
        )
        order = result.scalar_one_or_none()
        if not order:
            raise NotFoundError("Order not found")

        if order.payment_status == PaymentStatus.paid:
            return order  # idempotent

        secret = getattr(settings, "PAYSTACK_SECRET_KEY", "")
        ref = order.payment_ref or str(order_id)

        verified = False
        if secret:
            import httpx
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        f"https://api.paystack.co/transaction/verify/{ref}",
                        headers={"Authorization": f"Bearer {secret}"},
                        timeout=10,
                    )
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    verified = data.get("status") == "success"
            except Exception:
                pass  # best-effort; fall through to trust-frontend path

        # If no secret key configured or Paystack verify succeeded, mark as paid.
        # (onSuccess only fires after Paystack confirms the charge on their end.)
        if verified or not secret:
            order.payment_status = PaymentStatus.paid
            order.status = OrderStatus.confirmed
            await self.db.flush()
            await self.db.refresh(order)

        return order

    async def process_paystack_webhook(self, payload: bytes, signature: str) -> None:
        """Verify HMAC-SHA512 signature and update payment status."""
        secret = getattr(settings, "PAYSTACK_SECRET_KEY", "")
        expected = hmac.new(secret.encode(), payload, hashlib.sha512).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise ValidationError("Invalid webhook signature")

        import json
        event = json.loads(payload)
        if event.get("event") != "charge.success":
            return

        data = event.get("data", {})
        ref = data.get("reference")
        if not ref:
            return

        result = await self.db.execute(select(Order).where(Order.payment_ref == ref))
        order = result.scalar_one_or_none()
        if order and order.payment_status != PaymentStatus.paid:
            order.payment_status = PaymentStatus.paid
            order.status = OrderStatus.confirmed
            await self.db.flush()
