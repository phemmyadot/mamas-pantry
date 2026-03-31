"""Phase 2 schema revisions: product overhaul, order additions, new tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-28
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── riders (needed before orders FK) ──────────────────────────────────────
    op.create_table(
        "riders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("current_lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("current_lng", sa.Numeric(9, 6), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("phone"),
    )

    # ── products: fix enum + new columns ──────────────────────────────────────
    # Step 1: add a temp text column, copy data, drop old enum column
    op.add_column("products", sa.Column("category_new", sa.Text(), nullable=True))
    op.execute("""
        UPDATE products
        SET category_new = CASE
            WHEN category::text = 'mums_pick' THEN 'imported'
            ELSE category::text
        END
    """)

    # Step 2: drop old column and enum type
    op.drop_column("products", "category")
    op.execute("DROP TYPE IF EXISTS productcategory")

    # Step 3: create new enum and column
    op.execute("CREATE TYPE productcategory AS ENUM ('imported', 'local', 'chilled', 'household')")
    op.add_column(
        "products",
        sa.Column(
            "category",
            postgresql.ENUM("imported", "local", "chilled", "household", name="productcategory", create_type=False),
            nullable=True,
        ),
    )
    op.execute("UPDATE products SET category = category_new::productcategory")
    op.alter_column("products", "category", nullable=False)
    op.drop_column("products", "category_new")

    # Re-create the category index
    op.create_index("ix_products_category", "products", ["category"])

    # Step 4: add new product columns
    op.add_column("products", sa.Column("slug", sa.String(220), nullable=True))
    op.add_column("products", sa.Column("compare_price_ngn", sa.Numeric(12, 2), nullable=True))
    op.add_column("products", sa.Column("is_mums_pick", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("products", sa.Column("origin", sa.String(100), nullable=True))
    op.add_column("products", sa.Column("images", postgresql.ARRAY(sa.String(500)), nullable=False, server_default="{}"))

    # Populate slug from name for existing rows (slug = lowercase, spaces→hyphens)
    op.execute("""
        UPDATE products
        SET slug = regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g')
        WHERE slug IS NULL
    """)
    op.alter_column("products", "slug", nullable=False)
    op.create_unique_constraint("uq_products_slug", "products", ["slug"])
    op.create_index("ix_products_slug", "products", ["slug"])

    # ── orders: new status enum + new columns ─────────────────────────────────
    # Add 'confirmed' to orderstatus enum
    op.execute("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'confirmed' AFTER 'pending'")

    # Add payment_status enum
    op.execute("CREATE TYPE paymentstatus AS ENUM ('unpaid', 'paid', 'failed')")

    op.add_column(
        "orders",
        sa.Column(
            "payment_status",
            postgresql.ENUM("unpaid", "paid", "failed", name="paymentstatus", create_type=False),
            nullable=False,
            server_default="unpaid",
        ),
    )
    op.add_column("orders", sa.Column("payment_ref", sa.String(100), nullable=True))
    op.add_column("orders", sa.Column("subtotal_ngn", sa.Numeric(12, 2), nullable=True))
    op.add_column("orders", sa.Column("delivery_fee_ngn", sa.Numeric(12, 2), nullable=False, server_default="500.00"))
    op.add_column(
        "orders",
        sa.Column("rider_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column("orders", sa.Column("notes", sa.Text(), nullable=True))

    # Back-fill subtotal_ngn = total_ngn for existing orders (no delivery fee previously)
    op.execute("UPDATE orders SET subtotal_ngn = total_ngn WHERE subtotal_ngn IS NULL")
    op.alter_column("orders", "subtotal_ngn", nullable=False)

    op.create_foreign_key("fk_orders_rider_id", "orders", "riders", ["rider_id"], ["id"], ondelete="SET NULL")

    # ── addresses ─────────────────────────────────────────────────────────────
    op.create_table(
        "addresses",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("label", sa.String(50), nullable=False),
        sa.Column("street", sa.String(300), nullable=False),
        sa.Column("area", sa.String(100), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_addresses_user_id", "addresses", ["user_id"])

    # ── shipments ─────────────────────────────────────────────────────────────
    op.execute("CREATE TYPE shipmentstatus AS ENUM ('upcoming', 'in_transit', 'arrived', 'cleared')")
    op.create_table(
        "shipments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("origin_country", sa.String(100), nullable=False),
        sa.Column("departure_date", sa.Date(), nullable=False),
        sa.Column("arrival_date", sa.Date(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("upcoming", "in_transit", "arrived", "cleared", name="shipmentstatus", create_type=False),
            nullable=False,
            server_default="upcoming",
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    # ── pre_orders ────────────────────────────────────────────────────────────
    op.execute("CREATE TYPE preorderstatus AS ENUM ('pending', 'confirmed', 'cancelled')")
    op.create_table(
        "pre_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("shipment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("pending", "confirmed", "cancelled", name="preorderstatus", create_type=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["shipment_id"], ["shipments.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pre_orders_user_id", "pre_orders", ["user_id"])
    op.create_index("ix_pre_orders_shipment_id", "pre_orders", ["shipment_id"])

    # ── loyalty_transactions ──────────────────────────────────────────────────
    op.execute("CREATE TYPE loyaltytransactiontype AS ENUM ('EARN', 'REDEEM', 'EXPIRE')")
    op.create_table(
        "loyalty_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column(
            "type",
            postgresql.ENUM("EARN", "REDEEM", "EXPIRE", name="loyaltytransactiontype", create_type=False),
            nullable=False,
        ),
        sa.Column("description", sa.String(300), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_loyalty_transactions_user_id", "loyalty_transactions", ["user_id"])

    # ── promo_codes ───────────────────────────────────────────────────────────
    op.execute("CREATE TYPE discounttype AS ENUM ('PERCENTAGE', 'FIXED')")
    op.create_table(
        "promo_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column(
            "discount_type",
            postgresql.ENUM("PERCENTAGE", "FIXED", name="discounttype", create_type=False),
            nullable=False,
        ),
        sa.Column("discount_value", sa.Numeric(10, 2), nullable=False),
        sa.Column("min_order_ngn", sa.Numeric(12, 2), nullable=True),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_promo_codes_code", "promo_codes", ["code"])


def downgrade() -> None:
    # New tables
    op.drop_index("ix_promo_codes_code", "promo_codes")
    op.drop_table("promo_codes")
    op.execute("DROP TYPE IF EXISTS discounttype")

    op.drop_index("ix_loyalty_transactions_user_id", "loyalty_transactions")
    op.drop_table("loyalty_transactions")
    op.execute("DROP TYPE IF EXISTS loyaltytransactiontype")

    op.drop_index("ix_audit_logs_user_id", "audit_logs")
    op.drop_table("audit_logs")
    op.execute("DROP TYPE auditeventtype")

    op.drop_index("ix_pre_orders_shipment_id", "pre_orders")
    op.drop_index("ix_pre_orders_user_id", "pre_orders")
    op.drop_table("pre_orders")
    op.execute("DROP TYPE IF EXISTS preorderstatus")

    op.drop_table("shipments")
    op.execute("DROP TYPE IF EXISTS shipmentstatus")

    op.drop_index("ix_addresses_user_id", "addresses")
    op.drop_table("addresses")

    # Orders: remove new columns
    op.drop_constraint("fk_orders_rider_id", "orders", type_="foreignkey")
    op.drop_column("orders", "notes")
    op.drop_column("orders", "rider_id")
    op.drop_column("orders", "delivery_fee_ngn")
    op.drop_column("orders", "subtotal_ngn")
    op.drop_column("orders", "payment_ref")
    op.drop_column("orders", "payment_status")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
    # Note: cannot remove enum values from orderstatus in PostgreSQL without full type recreation

    # Riders
    op.drop_table("riders")

    # Products: revert slug + new columns
    op.drop_index("ix_products_slug", "products")
    op.drop_constraint("uq_products_slug", "products", type_="unique")
    op.drop_column("products", "images")
    op.drop_column("products", "origin")
    op.drop_column("products", "is_mums_pick")
    op.drop_column("products", "compare_price_ngn")
    op.drop_column("products", "slug")

    # Revert productcategory enum
    op.drop_index("ix_products_category", "products")
    op.add_column("products", sa.Column("category_old", sa.Text(), nullable=True))
    op.execute("UPDATE products SET category_old = category::text")
    op.drop_column("products", "category")
    op.execute("DROP TYPE IF EXISTS productcategory")
    op.execute("CREATE TYPE productcategory AS ENUM ('mums_pick', 'local', 'imported')")
    op.add_column(
        "products",
        sa.Column(
            "category",
            postgresql.ENUM("mums_pick", "local", "imported", name="productcategory", create_type=False),
            nullable=True,
        ),
    )
    op.execute("""
        UPDATE products
        SET category = CASE
            WHEN category_old IN ('chilled', 'household') THEN 'imported'
            ELSE category_old
        END::productcategory
    """)
    op.alter_column("products", "category", nullable=False)
    op.drop_column("products", "category_old")
    op.create_index("ix_products_category", "products", ["category"])
