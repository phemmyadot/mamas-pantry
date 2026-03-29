import uuid

from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models.user import User


def _with_roles(stmt):
    """Eagerly load the roles relationship when RBAC is enabled."""
    if settings.ENABLE_RBAC:
        # User.roles is only defined when ENABLE_RBAC=True, so this is safe
        stmt = stmt.options(selectinload(User.roles))  # type: ignore[attr-defined]
    return stmt


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, **kwargs) -> User:
        user = User(**kwargs)
        self.session.add(user)
        await self.session.flush()
        if settings.ENABLE_RBAC:
            await self.session.refresh(user, attribute_names=["roles"])
        return user

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        stmt = _with_roles(select(User).where(User.id == user_id))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        stmt = _with_roles(select(User).where(User.email == email.lower().strip()))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> User | None:
        stmt = _with_roles(select(User).where(User.username == username))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_by_id(self, user_id: uuid.UUID, **kwargs) -> None:
        stmt = update(User).where(User.id == user_id).values(**kwargs)
        await self.session.execute(stmt)

    async def list_all(self, offset: int = 0, limit: int = 50) -> list[User]:
        stmt = _with_roles(select(User)).offset(offset).limit(limit).order_by(User.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
