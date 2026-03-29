"""Add ready_for_pickup status for pickup order flow.

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-28
"""

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'ready_for_pickup' AFTER 'packed'")


def downgrade() -> None:
    # PostgreSQL enum values cannot be removed safely without full type recreation.
    pass

