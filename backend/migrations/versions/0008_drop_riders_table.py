"""Drop riders table; move phone/location onto users; rider_id on orders now refs users.

Revision ID: 0008
Revises: 0007
Create Date: 2026-03-30
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add rider-relevant columns to users
    op.add_column("users", sa.Column("phone", sa.String(20), nullable=True))
    op.add_column("users", sa.Column("current_lat", sa.Numeric(9, 6), nullable=True))
    op.add_column("users", sa.Column("current_lng", sa.Numeric(9, 6), nullable=True))

    # 2. Null out orders.rider_id so we can drop the FK + table
    op.execute("UPDATE orders SET rider_id = NULL")

    # 3. Drop old FK: orders.rider_id → riders.id
    op.drop_constraint("fk_orders_rider_id", "orders", type_="foreignkey")

    # 4. Drop FK added in 0007: riders.user_id → users.id
    op.drop_constraint("fk_riders_user_id", "riders", type_="foreignkey")
    op.drop_index("ix_riders_user_id", table_name="riders")

    # 5. Drop riders table
    op.drop_table("riders")

    # 6. Add new FK: orders.rider_id → users.id
    op.create_foreign_key(
        "orders_rider_id_fkey",
        "orders",
        "users",
        ["rider_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    # Re-create riders table (minimal — data is lost)
    op.create_table(
        "riders",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False, unique=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("current_lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("current_lng", sa.Numeric(9, 6), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.drop_constraint("orders_rider_id_fkey", "orders", type_="foreignkey")
    op.execute("UPDATE orders SET rider_id = NULL")
    op.create_foreign_key(
        "fk_orders_rider_id", "orders", "riders", ["rider_id"], ["id"], ondelete="SET NULL"
    )
    op.drop_column("users", "current_lng")
    op.drop_column("users", "current_lat")
    op.drop_column("users", "phone")
