"""Add delivery zone fees table.

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-28
"""

import uuid

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "delivery_zone_fees",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("area", sa.String(100), nullable=False, unique=True),
        sa.Column("fee_ngn", sa.Numeric(12, 2), nullable=False, server_default="500.00"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_delivery_zone_fees_area", "delivery_zone_fees", ["area"], unique=True)
    delivery_zone_fees = sa.table(
        "delivery_zone_fees",
        sa.column("id", UUID(as_uuid=True)),
        sa.column("area", sa.String(100)),
        sa.column("fee_ngn", sa.Numeric(12, 2)),
    )
    op.bulk_insert(
        delivery_zone_fees,
        [
            {"id": uuid.uuid4(), "area": "Magodo Phase 1", "fee_ngn": 500.00},
            {"id": uuid.uuid4(), "area": "Magodo Phase 2", "fee_ngn": 500.00},
            {"id": uuid.uuid4(), "area": "Alapere", "fee_ngn": 500.00},
            {"id": uuid.uuid4(), "area": "Ketu", "fee_ngn": 500.00},
            {"id": uuid.uuid4(), "area": "Ojota", "fee_ngn": 500.00},
        ],
    )
    op.execute("DELETE FROM delivery_zone_fees WHERE area = 'Other'")


def downgrade() -> None:
    op.drop_index("ix_delivery_zone_fees_area", table_name="delivery_zone_fees")
    op.drop_table("delivery_zone_fees")
