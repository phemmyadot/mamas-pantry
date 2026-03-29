"""Add SKU to products and backfill existing rows.

Revision ID: 0006
Revises: 0005
Create Date: 2026-03-28
"""

import sqlalchemy as sa
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("products", sa.Column("sku", sa.String(length=64), nullable=True))
    op.execute(
        """
        WITH ranked AS (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
            FROM products
        )
        UPDATE products AS p
        SET sku = 'SKU-' || LPAD(r.rn::text, 6, '0')
        FROM ranked AS r
        WHERE p.id = r.id AND p.sku IS NULL
        """
    )
    op.alter_column("products", "sku", nullable=False)
    op.create_index("ix_products_sku", "products", ["sku"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_products_sku", table_name="products")
    op.drop_column("products", "sku")
