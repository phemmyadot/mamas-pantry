"""
Create an admin user and assign the super_admin role.

Run from backend/ directory:
    python -m app.scripts.seed_admin

Credentials are read from env vars (with safe defaults for local dev):
    ADMIN_EMAIL     — defaults to admin@mamaspantry.ng
    ADMIN_PASSWORD  — defaults to Admin1234!  (change before deploy)
    ADMIN_USERNAME  — defaults to admin
"""

import asyncio
import os
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import async_session_factory
from app.db.models.user import User
from app.db.models.role import Role


ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL",    "admin@mamaspantry.ng")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin1234!")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")


async def seed() -> None:
    if not settings.ENABLE_RBAC:
        print("ENABLE_RBAC is false — cannot assign roles. Set it to true and re-run.")
        return

    async with async_session_factory() as session:
        # Ensure super_admin role exists
        result = await session.execute(select(Role).where(Role.name == "super_admin"))
        role = result.scalar_one_or_none()
        if not role:
            print("  'super_admin' role not found — run seed_roles.py first.")
            return

        # Check if admin user already exists (eager-load roles to avoid greenlet error)
        result = await session.execute(
            select(User).where(User.email == ADMIN_EMAIL).options(selectinload(User.roles))
        )
        user = result.scalar_one_or_none()

        if user:
            print(f"  User '{ADMIN_EMAIL}' already exists.")
        else:
            user = User(
                email=ADMIN_EMAIL,
                username=ADMIN_USERNAME,
                hashed_password=hash_password(ADMIN_PASSWORD),
                is_active=True,
                is_verified=True,
            )
            # Mark email as verified if the column exists
            if settings.ENABLE_EMAIL_VERIFICATION:
                user.email_verified_at = datetime.now(timezone.utc)

            session.add(user)
            await session.flush()  # populate user.id before assigning roles
            await session.refresh(user, attribute_names=["roles"])
            print(f"  Created user '{ADMIN_EMAIL}'")

        # Assign super_admin role if not already assigned
        if role not in user.roles:
            user.roles.append(role)
            print(f"  Assigned 'super_admin' role to '{ADMIN_EMAIL}'")
        else:
            print(f"  '{ADMIN_EMAIL}' already has 'super_admin' role.")

        await session.commit()

    print()
    print("Admin credentials:")
    print(f"  Email:    {ADMIN_EMAIL}")
    print(f"  Password: {ADMIN_PASSWORD}")
    print()
    if ADMIN_PASSWORD == "Admin1234!":
        print("  WARNING: Using default password -- set ADMIN_PASSWORD env var before deploying.")


if __name__ == "__main__":
    asyncio.run(seed())
