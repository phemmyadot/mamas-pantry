from __future__ import annotations
import uuid
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import hash_password
from app.core.exceptions import NotFoundError, ValidationError
from app.db.models.role import Role, UserRole
from app.db.models.order import Order, PaymentStatus
from app.db.models.user import User
from app.db.repositories.token_repo import TokenRepository
from app.db.repositories.user_repo import UserRepository


class AdminService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)
        self.token_repo = TokenRepository(session)

    async def list_users(self, offset: int = 0, limit: int = 50) -> list[User]:
        return await self.user_repo.list_all(offset=offset, limit=limit)

    async def _get_or_create_role(self, role_name: str) -> Role:
        role_result = await self.session.execute(select(Role).where(Role.name == role_name))
        role = role_result.scalar_one_or_none()
        if role:
            return role
        role = Role(
            name=role_name,
            description=f"{role_name.capitalize()} role",
            permissions=[],
        )
        self.session.add(role)
        await self.session.flush()
        return role

    async def list_users_by_role_names(self, role_names: list[str]) -> list[User]:
        stmt = (
            select(User)
            .join(UserRole, UserRole.c.user_id == User.id)
            .join(Role, Role.id == UserRole.c.role_id)
            .where(Role.name.in_(role_names))
            .order_by(User.created_at.desc())
        )
        if settings.ENABLE_RBAC:
            stmt = stmt.options(selectinload(User.roles))  # type: ignore[attr-defined]
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    async def create_user_with_role(
        self,
        email: str,
        password: str,
        username: str | None,
        role_name: str,
    ) -> User:
        email = email.lower().strip()
        if await self.user_repo.get_by_email(email):
            raise ValidationError("Email already registered")
        if username and await self.user_repo.get_by_username(username):
            raise ValidationError("Username already taken")

        user = await self.user_repo.create(
            email=email,
            username=username,
            hashed_password=hash_password(password),
            is_active=True,
            is_verified=False,
        )
        await self.assign_named_role(user.id, role_name)
        refreshed = await self.user_repo.get_by_id(user.id)
        return refreshed or user

    async def assign_role(self, user_id: uuid.UUID, role_id: uuid.UUID) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        role = await self.session.get(Role, role_id)
        if not role:
            raise NotFoundError("Role not found")

        # Check if already assigned
        stmt = select(UserRole).where(
            UserRole.c.user_id == user_id, UserRole.c.role_id == role_id
        )
        result = await self.session.execute(stmt)
        if result.first():
            raise ValidationError("Role already assigned to user")

        await self.session.execute(UserRole.insert().values(user_id=user_id, role_id=role_id))
        await self.session.flush()

    async def remove_role(self, user_id: uuid.UUID, role_id: uuid.UUID) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        stmt = delete(UserRole).where(
            UserRole.c.user_id == user_id, UserRole.c.role_id == role_id
        )
        result = await self.session.execute(stmt)
        if result.rowcount == 0:
            raise NotFoundError("Role assignment not found")

    async def assign_named_role(self, user_id: uuid.UUID, role_name: str) -> None:
        role = await self._get_or_create_role(role_name)
        await self.assign_role(user_id=user_id, role_id=role.id)

    async def remove_named_role(self, user_id: uuid.UUID, role_name: str) -> None:
        role_result = await self.session.execute(select(Role).where(Role.name == role_name))
        role = role_result.scalar_one_or_none()
        if not role:
            raise NotFoundError("Role not found")
        await self.remove_role(user_id=user_id, role_id=role.id)

    async def ban_user(self, user_id: uuid.UUID) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        await self.user_repo.update_by_id(user_id, is_active=False)
        await self.token_repo.revoke_all_for_user(user_id)

    async def unban_user(self, user_id: uuid.UUID) -> None:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundError("User not found")

        await self.user_repo.update_by_id(user_id, is_active=True)

    async def get_staff_user(self, user_id: uuid.UUID) -> User:
        users = await self.list_users_by_role_names(["staff", "rider"])
        user = next((u for u in users if u.id == user_id), None)
        if not user:
            raise NotFoundError("Staff user not found")
        return user

    async def get_staff_performance(self, user_id: uuid.UUID) -> dict:
        user = await self.get_staff_user(user_id)

        result = await self.session.execute(
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .options(selectinload(Order.items))
        )
        all_orders = list(result.scalars().all())
        in_store_orders = [
            o for o in all_orders if (o.delivery_address or {}).get("order_channel") == "in_store"
        ]

        total_orders = len(in_store_orders)
        if total_orders == 0:
            return {
                "user": user,
                "metrics": {
                    "total_orders": 0,
                    "paid_orders": 0,
                    "pending_orders": 0,
                    "total_items": 0,
                    "total_revenue_ngn": 0.0,
                    "avg_time_per_item_minutes": 0.0,
                    "avg_order_processing_minutes": 0.0,
                    "avg_daily_orders": 0.0,
                    "avg_daily_revenue_ngn": 0.0,
                    "first_order_at": None,
                    "last_order_at": None,
                },
                "recent_orders": [],
            }

        paid_orders = [o for o in in_store_orders if o.payment_status == PaymentStatus.paid]
        pending_orders = [o for o in in_store_orders if o.payment_status != PaymentStatus.paid]
        total_items = sum(sum(item.qty for item in o.items) for o in in_store_orders)
        total_revenue = sum(Decimal(str(o.total_ngn)) for o in paid_orders)

        order_minutes: list[float] = []
        per_item_minutes: list[float] = []
        for order in paid_orders:
            item_qty = sum(item.qty for item in order.items)
            if item_qty <= 0:
                continue
            minutes = max((order.updated_at - order.created_at).total_seconds() / 60.0, 0.0)
            order_minutes.append(minutes)
            per_item_minutes.append(minutes / item_qty)

        active_days = {o.created_at.date().isoformat() for o in in_store_orders}
        days_count = max(len(active_days), 1)

        recent_orders = []
        for order in in_store_orders[:10]:
            item_qty = sum(item.qty for item in order.items)
            processing_minutes = max((order.updated_at - order.created_at).total_seconds() / 60.0, 0.0)
            recent_orders.append(
                {
                    "id": order.id,
                    "status": order.status,
                    "payment_status": order.payment_status,
                    "total_ngn": float(Decimal(str(order.total_ngn))),
                    "item_count": item_qty,
                    "created_at": order.created_at,
                    "processing_minutes": processing_minutes,
                }
            )

        return {
            "user": user,
            "metrics": {
                "total_orders": total_orders,
                "paid_orders": len(paid_orders),
                "pending_orders": len(pending_orders),
                "total_items": total_items,
                "total_revenue_ngn": float(total_revenue),
                "avg_time_per_item_minutes": float(sum(per_item_minutes) / len(per_item_minutes)) if per_item_minutes else 0.0,
                "avg_order_processing_minutes": float(sum(order_minutes) / len(order_minutes)) if order_minutes else 0.0,
                "avg_daily_orders": float(total_orders / days_count),
                "avg_daily_revenue_ngn": float(total_revenue / days_count),
                "first_order_at": in_store_orders[-1].created_at,
                "last_order_at": in_store_orders[0].created_at,
            },
            "recent_orders": recent_orders,
        }
