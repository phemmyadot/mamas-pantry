"""Add user_id FK to riders table.

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-30
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "riders",
        sa.Column("user_id", UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_riders_user_id",
        "riders",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_riders_user_id", "riders", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_riders_user_id", table_name="riders")
    op.drop_constraint("fk_riders_user_id", "riders", type_="foreignkey")
    op.drop_column("riders", "user_id")
